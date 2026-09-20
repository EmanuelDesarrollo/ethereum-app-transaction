# Prompt para Claude Code — Checkout de pagos con stablecoin + agente de cobro

Copia y pega todo este documento como el primer mensaje a Claude Code, en la carpeta
donde solo tienes las skills de ETH. Empezamos el proyecto desde cero.

---

## 1. Contexto y urgencia

Estoy participando en el hackathon **ETHCali Builders Tour**. La entrega es el
**20 de septiembre a las 13:30 (hora Colombia)** — el tiempo es muy corto, prioriza
siempre lo que hace funcionar el demo por encima de features nuevas.

Tracks a los que voy a aplicar (selecciónalos también en el README y la doc técnica):
- **EAG → "Real-World Ethereum Applications"**
- **HSK Chain (HashKey Chain) → "Stablecoins"**

Antes de escribir Solidity o desplegar nada, lee y sigue las skills que ya tengo en
la carpeta `./eth-skills/` (o donde estén) — en especial `ship/SKILL.md` (arquitectura,
CROPS gate, litmus test onchain/offchain) y `security/SKILL.md` antes de tocar el contrato.

## 2. Qué estamos construyendo (una frase)

Una app móvil de React Native con **dos roles** para un comercio real (una tienda de
ropa que ya vende online): el **comercio** cobra usando un **agente de IA por lenguaje
natural o audio** (function calling con la API de Claude), y la **persona/cliente**
paga escaneando un QR con su propia wallet no-custodial. El pago se hace en un
stablecoin de prueba sobre **HSK Chain testnet**, y cada venta queda registrada
on-chain en un contrato simple.

## 3. Caso de uso concreto

1. El comercio dice o escribe: *"cóbrale 15 dólares a Ana por la camisa azul"*
2. El agente interpreta el texto, extrae `{monto: 15, moneda: "USDC", nota: "camisa azul"}`
   y llama internamente al endpoint de checkout
3. Se genera un QR/link de pago
4. Ana (la clienta) escanea el QR con la app en su rol de "persona" — su wallet firma
   la transacción localmente y la transmite a HSK Chain testnet
5. El backend detecta la confirmación on-chain (evento del contrato)
6. El agente le responde al comercio: *"✓ Ana pagó $15 USDC, confirmado"*

## 4. Arquitectura completa

```
tienda-stablecoin-pay/
├── app/                          ← React Native (Clean Architecture / MVVM)
│   ├── src/features/comercio/    ← input texto/voz + pantalla de QR generado
│   ├── src/features/persona/     ← scanner de QR + wallet local
│   └── src/agent/                ← cliente que llama a POST /agent/message
├── api/                          ← Node + Express + TypeScript
│   ├── agent/
│   │   ├── tools.ts              ← schema de la function "crear_cobro"
│   │   └── router.ts             ← POST /agent/message (function calling con Claude API)
│   ├── checkout/
│   │   └── service.ts            ← POST /checkout (crea sesión, genera QR)
│   └── listeners/
│       └── events.ts             ← escucha eventos on-chain con viem
├── contracts/                    ← Foundry (forge/cast/anvil)
│   ├── src/SalesRegistry.sol
│   ├── test/SalesRegistry.t.sol
│   └── script/Deploy.s.sol
├── checkout-widget/              ← snippet HTML/JS embebible (demo genérica)
│   └── index.html
├── README.md
└── docs/
    └── technical-documentation.md
```

## 5. Stack técnico (no lo cambies sin decírmelo)

- **App**: React Native + TypeScript, Clean Architecture / MVVM (mi patrón habitual),
  wallet no-custodial con `viem`, llave privada en Keychain (iOS) / Keystore (Android) —
  nunca sale del dispositivo
- **Backend**: Node.js + Express + TypeScript
- **Blockchain**: `viem` para firmar/leer transacciones y escuchar eventos
- **Red**: HSK Chain testnet (faucet: https://hskchain.net/faucet) — NO uses Ethereum
  mainnet ni otro L2, tiene que ser HSK Chain para calificar al track
- **Contrato**: Solidity con OpenZeppelin como base, compilado/testeado/desplegado con Foundry
- **Agente**: Anthropic API (`@anthropic-ai/sdk`), modelo `claude-sonnet-5`, con
  **tool use / function calling** — la API key SIEMPRE en el backend, nunca en el cliente
- **Voz (si alcanza el tiempo)**: reconocimiento de voz nativo del dispositivo para
  convertir a texto ANTES de llegar al agente — el modelo nunca procesa audio directo

## 6. El contrato — `SalesRegistry.sol`

Un solo contrato, lo más simple posible (según el litmus test: esto es un compromiso
permanente verificable, por eso justifica estar onchain):

- `registrarVenta(address comercio, uint256 monto, string memory nota)` — se llama
  automáticamente desde el backend cuando el pago se confirma
- `event VentaRegistrada(address indexed comercio, uint256 monto, string nota, uint256 timestamp)`
- Sin lógica de custodia de fondos — el stablecoin se transfiere directo entre wallets
  (transferencia ERC-20 normal), el contrato solo **anota** que ocurrió

No agregues nada más a este contrato (nada de historial crediticio, nada de políticas
de gasto, nada de roles/permisos complejos) — eso va solo en el roadmap del documento
técnico, no en el código.

## 7. El agente de cobro — function calling

Endpoint `POST /agent/message`:
- Recibe texto plano del comercio
- Define una tool `crear_cobro` con inputs `{monto: number, moneda: "USDC"|"USDT", nota?: string}`
- Si el modelo pide usar la tool, el backend ejecuta la función real (llama a
  `POST /checkout`), nunca el modelo directamente
- El resultado (QR generado) se le devuelve al modelo como `tool_result` para que
  arme la respuesta final en lenguaje natural
- Si falta el monto o la moneda, el agente debe preguntar antes de actuar, no asumir

Prompt de sistema sugerido: *"Eres el asistente de cobro de una tienda. Cuando el
comercio te pida cobrar algo, usa la herramienta crear_cobro con el monto exacto.
Si falta el monto o la moneda, pregunta antes de actuar. Responde siempre en español,
breve y claro."*

## 8. El widget embebible

Un snippet de HTML/JS genérico (no depende de Shopify/WooCommerce específico) que
cualquier sitio pueda pegar — para la demo, muéstralo funcionando en una página de
ejemplo, no hace falta tocar el sitio real de la tienda.

## 9. Qué SÍ construir (MVP innegociable)

- [ ] Contrato `SalesRegistry.sol` desplegado y verificado en HSK Chain testnet
- [ ] `POST /checkout` — genera sesión de pago + QR
- [ ] `POST /agent/message` — agente cajero con function calling (texto)
- [ ] Listener de eventos on-chain que detecta la confirmación del pago
- [ ] App RN: rol Comercio (input texto → ve QR → ve confirmación)
- [ ] App RN: rol Persona (escanea QR → firma con wallet local → paga)
- [ ] README completo (features, instalación, cómo correrlo, arquitectura técnica)
- [ ] `docs/technical-documentation.md` (track elegido, arquitectura, roadmap)

## 10. Qué NO construir ahora (solo mencionar como roadmap en la doc técnica)

- Off-ramp real a banco (solo describe el flujo con un proveedor tipo Bitso/Transak)
- NFC (Android emisor+receptor, iOS solo emisor — queda para después)
- Historial crediticio / reporte de ingresos para microcréditos
- Arquitectura multiagente completa (agente verificador, agente de riesgo, motor de
  políticas, agente contable) — descríbela como "Fase 2" con un diagrama simple
- Integración con Machine Payment Protocol (MPP) para pagos autónomos agente-a-agente
- Entrada de voz, SI el tiempo no alcanza — queda como mejora incremental sobre el
  mismo endpoint de texto, no cambia la arquitectura

## 11. Cómo quiero que trabajes

1. Empieza por el contrato con Foundry (`forge init`, escribe `SalesRegistry.sol`,
   testéalo, despliégalo en HSK Chain testnet) — es la base de todo lo demás
2. Sigue con `POST /checkout` en el backend
3. Luego `POST /agent/message` con el function calling
4. Luego la app RN, primero el rol Persona (pagar) y después el rol Comercio (cobrar)
5. Al final, README y documentación técnica
6. En cada paso, dime qué decidiste y por qué si te desviaste de este documento —
   no asumas cambios de alcance sin decírmelo primero

## 12. Nota operativa: crash de arranque en iOS (symbol not found ExpoModulesJSI)

Si al compilar la app en iOS (`npx expo run:ios`) crashea al abrir con un error de
`dyld` tipo `Symbol not found: ...ExpoModulesJSI...runIsolated...`, es un desajuste
de ABI entre `ExpoModulesCore` (que Expo distribuye precompilado) y
`ExpoModulesJSI` (que siempre se compila localmente) — quedan compilados con
distinto toolchain de Swift. El fix vive en `app/plugins/withIosSwiftBuildFix.js`
(config plugin registrado en `app.json`), que se aplica solo al correr
`expo prebuild`/`expo run:ios` cuando `ios/` no existe todavía (esa carpeta está
en `.gitignore`, así que cada clone nuevo la regenera desde cero).

**Si el plugin deja de funcionar** (p. ej. tras un bump del SDK de Expo que cambie
el `Podfile` generado), aplica el fix a mano después de `npx expo prebuild`:

1. En `app/ios/Podfile.properties.json`, agrega `"ios.usePrecompiledModules": "false"`
2. En `app/ios/Podfile`, en la línea que dice
   `podfile_properties['EXPO_USE_PRECOMPILED_MODULES'] == 'false'`, cambia esa
   clave por `podfile_properties['ios.usePrecompiledModules'] == 'false'`
   (el Podfile que genera Expo trae un bug: lee la clave equivocada)
3. Dentro del bloque `post_install do |installer| ... end`, después de la llamada
   a `react_native_post_install(...)`, agrega:
   ```ruby
   installer.pods_project.targets.each do |target|
     target.build_configurations.each do |bc|
       bc.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
       bc.build_settings['SWIFT_VERSION'] = '5.0'
     end
   end
   ```
   (esto es necesario porque compilar `ExpoModulesCore` localmente expone errores
   reales de Swift 6 strict-concurrency en su propio código fuente, que Xcode 26
   trata como error en vez de warning)
4. `cd app/ios && EXPO_USE_PRECOMPILED_MODULES=0 pod install && cd .. && npx expo run:ios`