// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Anota ventas confirmadas onchain. No custodia fondos: el stablecoin
/// se transfiere directo entre wallets (ERC-20 normal); este contrato solo
/// deja un registro permanente y verificable de que la venta ocurrió.
contract SalesRegistry is Ownable {
    event VentaRegistrada(address indexed comercio, uint256 monto, string nota, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @dev Solo el backend (owner) llama esto, después de confirmar la
    /// transferencia ERC-20 onchain vía el listener de eventos.
    function registrarVenta(address comercio, uint256 monto, string calldata nota) external onlyOwner {
        require(comercio != address(0), "comercio invalido");
        require(monto > 0, "monto invalido");
        emit VentaRegistrada(comercio, monto, nota, block.timestamp);
    }
}
