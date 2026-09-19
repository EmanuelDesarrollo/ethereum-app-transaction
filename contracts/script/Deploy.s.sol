// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SalesRegistry} from "../src/SalesRegistry.sol";
import {MockStablecoin} from "../src/MockStablecoin.sol";

/// @dev Despliega SalesRegistry (owner = backend deployer) y MockStablecoin
/// para la demo en HSK Chain testnet.
///
/// Uso:
///   forge script script/Deploy.s.sol --rpc-url hsk_testnet --broadcast --verify
contract Deploy is Script {
    function run() external returns (SalesRegistry registry, MockStablecoin stablecoin) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        registry = new SalesRegistry(deployer);
        stablecoin = new MockStablecoin();

        vm.stopBroadcast();

        console.log("Deployer / owner:", deployer);
        console.log("SalesRegistry:", address(registry));
        console.log("MockStablecoin:", address(stablecoin));
    }
}
