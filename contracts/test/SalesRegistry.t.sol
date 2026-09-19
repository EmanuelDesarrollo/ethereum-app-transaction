// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SalesRegistry} from "../src/SalesRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SalesRegistryTest is Test {
    SalesRegistry registry;
    address owner = address(0xB0B);
    address comercio = address(0xC0FFEE);
    address stranger = address(0xBAD);

    function setUp() public {
        registry = new SalesRegistry(owner);
    }

    function test_OwnerCanRegistrarVenta() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit SalesRegistry.VentaRegistrada(comercio, 15_000_000, "camisa azul", block.timestamp);
        registry.registrarVenta(comercio, 15_000_000, "camisa azul");
    }

    function test_RevertWhen_NonOwnerCallsRegistrarVenta() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        registry.registrarVenta(comercio, 15_000_000, "camisa azul");
    }

    function test_RevertWhen_ComercioIsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("comercio invalido");
        registry.registrarVenta(address(0), 15_000_000, "camisa azul");
    }

    function test_RevertWhen_MontoIsZero() public {
        vm.prank(owner);
        vm.expectRevert("monto invalido");
        registry.registrarVenta(comercio, 0, "camisa azul");
    }

    function testFuzz_RegistrarVentaEmitsWithArbitraryValidInputs(
        address fuzzComercio,
        uint256 fuzzMonto,
        string memory nota
    ) public {
        vm.assume(fuzzComercio != address(0));
        vm.assume(fuzzMonto > 0);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit SalesRegistry.VentaRegistrada(fuzzComercio, fuzzMonto, nota, block.timestamp);
        registry.registrarVenta(fuzzComercio, fuzzMonto, nota);
    }
}
