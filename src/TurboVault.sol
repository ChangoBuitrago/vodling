// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEigenLayer.sol";

/**
 * @title TurboVault
 * @dev ERC4626 vault that receives yield from SafeVault and allows users to deposit stETH
 */
contract TurboVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ State Variables ============
    
    /// @dev EigenLayer contract address for restaking
    address public eigenLayer;
    
    /// @dev Total EigenLayer shares held by this vault
    uint256 public totalEigenLayerShares;
    
    /// @dev Pause functionality for EigenLayer operations
    bool public eigenLayerPaused;
    
    // ============ Events ============
    
    event YieldDeposited(address indexed from, uint256 amount, uint256 shares);
    event RestakedToEigenLayer(address indexed user, uint256 amount, uint256 shares);
    event WithdrawnFromEigenLayer(address indexed user, uint256 stETHAmount, uint256 turboVaultShares);
    event EigenLayerSet(address indexed eigenLayer);
    event EigenLayerPaused(bool paused);
    event EigenLayerYieldGenerated(uint256 _days);
    event RewardsDistributedToSafeVault(address indexed to, uint256 amount);
    
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
        
        // Transfer stETH from caller (SafeVault) to this contract and mint shares to caller
        _deposit(msg.sender, msg.sender, amount, shares);
        
        emit YieldDeposited(msg.sender, amount, shares);
        
        return shares;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get total assets in the vault including EigenLayer rewards
     * @return Total assets (stETH balance + EigenLayer rewards)
     */
    function totalAssets() public view override returns (uint256) {
        uint256 stETHBalance = IERC20(asset()).balanceOf(address(this));
        uint256 eigenLayerValue = 0;
        
        // Add EigenLayer rewards if EigenLayer is set and we have shares
        if (eigenLayer != address(0) && totalEigenLayerShares > 0) {
            eigenLayerValue = IEigenLayer(eigenLayer).getSharesValue(totalEigenLayerShares);
        }
        
        return stETHBalance + eigenLayerValue;
    }
    
    /**
     * @dev Get the underlying asset (stETH)
     * @return Asset token address
     */
    function asset() public view override returns (address) {
        return super.asset();
    }
    
    /**
     * @dev Get the total value of EigenLayer shares including rewards
     * @return Total value in stETH terms
     */
    function getEigenLayerTotalValue() external view returns (uint256) {
        if (eigenLayer == address(0) || totalEigenLayerShares == 0) return 0;
        return IEigenLayer(eigenLayer).getTotalValue();
    }
    
    /**
     * @dev Get the value of this vault's EigenLayer shares including rewards
     * @return Value in stETH terms
     */
    function getEigenLayerSharesValue() external view returns (uint256) {
        if (eigenLayer == address(0) || totalEigenLayerShares == 0) return 0;
        return IEigenLayer(eigenLayer).getSharesValue(totalEigenLayerShares);
    }
    
    // ============ EigenLayer Functions ============
    
    /**
     * @dev Set EigenLayer contract address
     * @param _eigenLayer EigenLayer contract address
     */
    function setEigenLayer(address _eigenLayer) external onlyOwner {
        require(_eigenLayer != address(0), "Invalid EigenLayer address");
        eigenLayer = _eigenLayer;
        emit EigenLayerSet(_eigenLayer);
    }
    
    /**
     * @dev Pause or unpause EigenLayer operations
     * @param _paused True to pause, false to unpause
     */
    function setEigenLayerPaused(bool _paused) external onlyOwner {
        eigenLayerPaused = _paused;
        emit EigenLayerPaused(_paused);
    }
    
    /**
     * @dev Restake TurboVault assets to EigenLayer (admin only)
     * This function allows the vault to restake its assets to EigenLayer for the benefit of all users
     * @param stETHAmount Amount of stETH to restake
     * @return eigenLayerShares Number of EigenLayer shares received
     */
    function restakeToEigenLayer(uint256 stETHAmount) external onlyOwner nonReentrant returns (uint256 eigenLayerShares) {
        require(stETHAmount > 0, "Amount must be greater than 0");
        require(eigenLayer != address(0), "EigenLayer not set");
        require(!eigenLayerPaused, "EigenLayer operations paused");
        require(IERC20(asset()).balanceOf(address(this)) >= stETHAmount, "Insufficient stETH balance");
        
        // Approve EigenLayer to spend stETH
        IERC20(asset()).approve(eigenLayer, stETHAmount);
        
        // Stake to EigenLayer
        eigenLayerShares = IEigenLayer(eigenLayer).stake(stETHAmount);
        
        // Update total EigenLayer shares held by this vault
        totalEigenLayerShares += eigenLayerShares;
        
        emit RestakedToEigenLayer(address(this), stETHAmount, eigenLayerShares);
        
        return eigenLayerShares;
    }
    
    /**
     * @dev Withdraw from EigenLayer back to TurboVault (admin only)
     * This completes the lifecycle and keeps funds within the Vodling ecosystem
     * @param eigenLayerShares Number of EigenLayer shares to withdraw
     * @return stETHAmount Amount of stETH received
     */
    function withdrawFromEigenLayer(uint256 eigenLayerShares) external onlyOwner nonReentrant returns (uint256 stETHAmount) {
        require(eigenLayerShares > 0, "Shares must be greater than 0");
        require(eigenLayer != address(0), "EigenLayer not set");
        require(!eigenLayerPaused, "EigenLayer operations paused");
        
        // Unstake from EigenLayer (this will transfer stETH back to this contract)
        stETHAmount = IEigenLayer(eigenLayer).unstake(eigenLayerShares);
        require(stETHAmount > 0, "No value to withdraw");
        
        // Update total EigenLayer shares held by this vault
        totalEigenLayerShares -= eigenLayerShares;
        
        emit WithdrawnFromEigenLayer(address(this), stETHAmount, eigenLayerShares);
        
        return stETHAmount;
    }
    
    /**
     * @dev Generate yield in EigenLayer by simulating time passage
     * @param _days Number of days to simulate
     */
    function generateEigenLayerYield(uint256 _days) external {
        require(eigenLayer != address(0), "EigenLayer not set");
        require(_days > 0, "Days must be greater than 0");
        
        // Call EigenLayer's generateYield function
        IEigenLayer(eigenLayer).generateYield(_days);
        
        emit EigenLayerYieldGenerated(_days);
    }
    
    /**
     * @dev Distribute compounded rewards back to SafeVault
     * This completes the full cycle: SafeVault -> TurboVault -> EigenLayer -> TurboVault -> SafeVault
     * @param amount Amount of stETH to distribute back to SafeVault
     */
    function distributeRewardsToSafeVault(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= IERC20(asset()).balanceOf(address(this)), "Insufficient balance");
        
        // Transfer stETH back to SafeVault
        require(IERC20(asset()).transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardsDistributedToSafeVault(msg.sender, amount);
    }
    
    // ============ Modifiers ============
    
    modifier whenEigenLayerNotPaused() {
        require(!eigenLayerPaused, "EigenLayer operations paused");
        _;
    }
}
