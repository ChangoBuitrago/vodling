// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TurboVault
 * @dev ERC4626 vault that receives yield from SafeVault and allows users to deposit stETH
 */
contract TurboVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Events ============
    
    event YieldDeposited(address indexed from, uint256 amount, uint256 shares);
    
    // ============ Constructor ============
    
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(msg.sender) {}
    
    // ============ External Functions ============
    
    /**
     * @dev Deposit yield from SafeVault
     * @param amount Amount of stETH to deposit as yield
     * @return shares Number of shares minted
     */
    function depositYield(uint256 amount) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate shares to mint
        shares = convertToShares(amount);
        
        // Transfer stETH from caller (SafeVault) to this contract and mint shares
        _deposit(msg.sender, address(this), amount, shares);
        
        emit YieldDeposited(msg.sender, amount, shares);
        
        return shares;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get total assets in the vault
     * @return Total assets (stETH balance)
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
    
    /**
     * @dev Get the underlying asset (stETH)
     * @return Asset token address
     */
    function asset() public view override returns (address) {
        return super.asset();
    }
}
