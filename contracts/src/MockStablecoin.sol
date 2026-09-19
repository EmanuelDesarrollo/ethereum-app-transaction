// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Stablecoin de prueba para la demo en HSK Chain testnet. 6 decimales
/// como USDC/USDT real. `faucet()` deja que cualquier wallet se sirva fondos
/// de prueba para poder pagar en la demo (no tiene valor real).
contract MockStablecoin is ERC20 {
    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** DECIMALS;

    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
