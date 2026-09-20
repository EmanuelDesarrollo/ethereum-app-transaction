const { withPodfile, withPodfileProperties } = require('expo/config-plugins');

/**
 * Fixes a launch crash on iOS: "Symbol not found: ...ExpoModulesJSI...runIsolated..."
 *
 * Root cause: Expo ships ExpoModulesCore as a precompiled binary, but
 * ExpoModulesJSI is always built locally as an xcframework. When the two are
 * compiled by different Swift toolchains their ABI can drift, and the
 * precompiled Core ends up referencing a JSI symbol that isn't present in the
 * locally-built JSI framework -> crash at launch (dyld, before any app code runs).
 *
 * Fix: force ExpoModulesCore to also build locally, so both are compiled by the
 * same toolchain. That alone then hits a second problem: Xcode 26 enforces
 * Swift 6 strict-concurrency checking as hard build errors on
 * expo-modules-core's own source (ios/Core/Events/EventEmitter.swift), which
 * only surfaces once it's compiled locally instead of using the precompiled
 * binary. So we also relax that checking for all pods.
 *
 * If this plugin ever stops working (e.g. after an Expo SDK bump changes the
 * generated Podfile), see the manual fallback documented in CLAUDE.md.
 */
function withIosSwiftBuildFix(config) {
  config = withPodfileProperties(config, (config) => {
    config.modResults['ios.usePrecompiledModules'] = 'false';
    return config;
  });

  config = withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    // Expo's generated Podfile checks the wrong properties key
    // (`EXPO_USE_PRECOMPILED_MODULES` instead of `ios.usePrecompiledModules`) to
    // decide whether to honor an explicit opt-out, so the property set above
    // would otherwise be silently ignored.
    contents = contents.replace(
      "podfile_properties['EXPO_USE_PRECOMPILED_MODULES'] == 'false'",
      "podfile_properties['ios.usePrecompiledModules'] == 'false'"
    );

    const marker = '# --- withIosSwiftBuildFix ---';
    if (!contents.includes(marker)) {
      const injected = [
        '',
        `    ${marker}`,
        '    # Relax Swift 6 strict-concurrency checking so pods built locally',
        '    # (see ios.usePrecompiledModules above) compile under Xcode 26.',
        '    # Fallback if this ever breaks: see CLAUDE.md.',
        '    installer.pods_project.targets.each do |target|',
        '      target.build_configurations.each do |bc|',
        "        bc.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'",
        "        bc.build_settings['SWIFT_VERSION'] = '5.0'",
        '      end',
        '    end',
        '',
      ].join('\n');

      const callPattern = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;
      if (callPattern.test(contents)) {
        contents = contents.replace(callPattern, `$1${injected}`);
      } else {
        throw new Error(
          'withIosSwiftBuildFix: no se encontró la llamada a react_native_post_install en el Podfile generado; revisa CLAUDE.md para el fix manual.'
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withIosSwiftBuildFix;
