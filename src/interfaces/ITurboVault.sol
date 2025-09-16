// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ITurboVault
 * @dev Interface for TurboVault contract
 */
interface ITurboVault is IERC20 {
    /**
     * @dev Deposit yield from SafeVault
     * @param amount Amount of stETH to deposit as yield
     * @return shares Number of shares minted
     */
    function depositYield(uint256 amount) external returns (uint256 shares);
    
    /**
     * @dev Convert shares to assets
     * @param shares Number of shares
     * @return assets Equivalent amount of assets
     */
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
    
    /**
     * @dev Convert assets to shares
     * @param assets Amount of assets
     * @return shares Equivalent number of shares
     */
    function convertToShares(uint256 assets) external view returns (uint256 shares);
}
