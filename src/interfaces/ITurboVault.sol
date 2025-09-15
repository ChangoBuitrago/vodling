// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITurboVault
 * @dev Interface for TurboVault contract
 */
interface ITurboVault {
    /**
     * @dev Deposit yield from SafeVault
     * @param amount Amount of stETH to deposit as yield
     * @return shares Number of shares minted
     */
    function depositYield(uint256 amount) external returns (uint256 shares);
}
