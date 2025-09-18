// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ILido.sol";
import "./interfaces/ITurboVault.sol";

/**
 * @title SafeVault
 * @dev A simplified vault where users deposit ETH for principal protection
 *      and staking via Lido. Yield accumulates and can be withdrawn separately.
 */
contract SafeVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    
    /// @dev Lido stETH contract
    ILido public immutable lido;
    
    /// @dev stETH token contract
    IERC20 public immutable stETH;
    
    
    /// @dev TurboVault contract address for yield distribution
    address public turboVault;
    
    /// @dev Total principal deposited by all users
    uint256 public totalPrincipal;
    
    /// @dev Mapping of user address to their principal balance
    mapping(address => uint256) public principalBalance;
    
    /// @dev Mapping of user address to their stETH shares at deposit time
    mapping(address => uint256) public userStETHShares;
    
    /// @dev Mapping to track how many yield shares each user has withdrawn
    mapping(address => uint256) public withdrawnYieldShares;
    
    /// @dev Minimum deposit amount (in wei)
    uint256 public minDeposit = 0.001 ether;
    
    /// @dev Minimum withdrawal amount (in wei)
    uint256 public minWithdraw = 0.001 ether;
    
    /// @dev Maximum deposit amount (in wei) - can be set by owner
    uint256 public maxDeposit = 1000 ether;
    
    // ============ Events ============
    
    event Deposit(address indexed user, uint256 amount, uint256 stETHShares);
    event WithdrawPrincipal(address indexed user, uint256 amount, uint256 stETHShares);
    event WithdrawTotal(address indexed user, uint256 amount, uint256 stETHShares);
    event LimitsUpdated(uint256 minDeposit, uint256 maxDeposit);
    event YieldHarvested(uint256 timestamp, uint256 yieldAmount);
    event YieldClaimed(address indexed user, uint256 amount);
    
    // ============ Errors ============
    
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();
    
    // ============ Constructor ============
    
    constructor(
        address _lido,
        address _stETH
    ) Ownable(msg.sender) {
        if (_lido == address(0) || _stETH == address(0)) {
            revert InvalidAmount();
        }
        
        lido = ILido(_lido);
        stETH = IERC20(_stETH);
    }
    
    // ============ External Functions ============
    
    /**
     * @dev Deposit ETH and stake via Lido
     * Uses msg.value as the deposit amount
     */
    function deposit() external payable nonReentrant whenNotPaused {
        uint256 amount = msg.value;
        if (amount < minDeposit || amount > maxDeposit) revert InvalidAmount();
        
        // Stake ETH with Lido
        uint256 stETHSharesReceived = lido.submit{value: amount}(address(0));
        
        // Update user's principal balance and track their stETH shares
        principalBalance[msg.sender] = principalBalance[msg.sender] + amount;
        userStETHShares[msg.sender] = userStETHShares[msg.sender] + stETHSharesReceived;
        totalPrincipal = totalPrincipal + amount;
        
        emit Deposit(msg.sender, amount, stETHSharesReceived);
    }
    
    /**
     * @dev Withdraw principal (unstakes from Lido)
     * @param amount Amount of ETH to withdraw
     */
    function withdrawPrincipal(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (principalBalance[msg.sender] < amount) revert InsufficientBalance();
        
        // Calculate the proportion of user's stETH shares to withdraw
        uint256 userShares = userStETHShares[msg.sender];
        uint256 totalUserPrincipal = principalBalance[msg.sender];
        uint256 sharesToWithdraw = (userShares * amount) / totalUserPrincipal;
        
        // Calculate how much ETH this represents
        uint256 ethToWithdraw = lido.getPooledEthByShares(sharesToWithdraw);
        
        // Update balances
        principalBalance[msg.sender] = principalBalance[msg.sender] - amount;
        userStETHShares[msg.sender] = userStETHShares[msg.sender] - sharesToWithdraw;
        totalPrincipal = totalPrincipal - amount;
        
        // Withdraw ETH from Lido (this will burn stETH and send ETH)
        lido.withdraw(sharesToWithdraw);
        
        // Send ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethToWithdraw}("");
        if (!success) revert TransferFailed();
        
        emit WithdrawPrincipal(msg.sender, amount, sharesToWithdraw);
    }
    
    /**
     * @dev Withdraw total balance (principal + yield)
     * @param amount Amount of ETH to withdraw (total balance)
     */
    function withdrawTotal(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (amount < minWithdraw) revert InvalidAmount();
        
        // Calculate total balance (current value of stETH shares)
        uint256 totalBalance = lido.getPooledEthByShares(userStETHShares[msg.sender]);
        if (amount > totalBalance) revert InsufficientBalance();
        
        // Calculate the proportion of shares to withdraw
        uint256 sharesToWithdraw = (userStETHShares[msg.sender] * amount) / totalBalance;
        
        // Calculate the proportion of principal to reduce
        uint256 principalToReduce = (principalBalance[msg.sender] * amount) / totalBalance;
        
        // Get the actual ETH amount that will be received from Lido
        uint256 actualEthAmount = lido.getPooledEthByShares(sharesToWithdraw);
        
        // Update user's balances
        userStETHShares[msg.sender] = userStETHShares[msg.sender] - sharesToWithdraw;
        principalBalance[msg.sender] = principalBalance[msg.sender] - principalToReduce;
        totalPrincipal = totalPrincipal - principalToReduce;
        
        // Withdraw ETH from Lido (this will burn stETH and send ETH to this contract)
        lido.withdraw(sharesToWithdraw);
        
        // Send the actual ETH amount received from Lido to user
        (bool success, ) = payable(msg.sender).call{value: actualEthAmount}("");
        if (!success) revert TransferFailed();
        
        emit WithdrawTotal(msg.sender, actualEthAmount, sharesToWithdraw);
    }
    
    /**
     * @dev Allows a user to claim their proportional share of the accumulated rewards.
     * This includes both Lido rewards and EigenLayer rewards that have been earned.
     * @return claimedAmount The amount of TurboVault shares transferred to the user.
     */
    function claimYieldShares() external nonReentrant whenNotPaused returns (uint256 claimedAmount) {
        // Get the user's principal deposit and the total principal in the vault
        uint256 userPrincipal = principalBalance[msg.sender];
        uint256 totalPrincipalAmount = totalPrincipal;

        require(userPrincipal > 0, "No principal deposited");
        require(turboVault != address(0), "TurboVault not set");

        // Get the total value of all rewards (Lido + EigenLayer) that users are entitled to
        // This is the total value of TurboVault shares that SafeVault holds
        uint256 totalRewardsValue = ITurboVault(turboVault).convertToAssets(
            ITurboVault(turboVault).balanceOf(address(this))
        );

        // Calculate the user's total entitlement based on their share of the principal
        // (userPrincipal * totalRewardsValue) / totalPrincipal
        uint256 totalEntitlement = (userPrincipal * totalRewardsValue) / totalPrincipalAmount;

        // Calculate how many TurboVault shares this entitlement represents
        uint256 totalEntitlementShares = ITurboVault(turboVault).convertToShares(totalEntitlement);

        // Calculate how many shares are available to be claimed right now
        // This is their total entitlement minus what they've already withdrawn
        claimedAmount = totalEntitlementShares - withdrawnYieldShares[msg.sender];
        require(claimedAmount > 0, "No new yield shares to claim");

        // Update the user's withdrawal record BEFORE the transfer to prevent re-entrancy
        withdrawnYieldShares[msg.sender] += claimedAmount;

        // Transfer the TurboVault shares from this contract to the user
        bool success = ITurboVault(turboVault).transfer(msg.sender, claimedAmount);
        require(success, "Share transfer failed");

        // Emit the event
        emit YieldClaimed(msg.sender, claimedAmount);

        return claimedAmount;
    }
    
    /**
     * @dev Harvest yield and compound it to TurboVault
     * This function calculates the total yield and transfers it to TurboVault
     */
    function harvestAndCompound() external onlyOwner {
        uint256 totalYield = this.getTotalYield();
        require(totalYield > 0, "No yield to harvest");
        require(turboVault != address(0), "TurboVault not set");
        
        // Get current total stETH value and shares
        uint256 totalStETHShares = lido.sharesOf(address(this));
        uint256 currentTotalValue = lido.getPooledEthByShares(totalStETHShares);
        
        // Calculate yield as a percentage of total shares
        // yieldShares = (totalYield / currentTotalValue) * totalStETHShares
        uint256 yieldShares = (totalStETHShares * totalYield) / currentTotalValue;
        
        require(yieldShares > 0, "No yield shares to harvest");
        require(yieldShares <= totalStETHShares, "Yield shares exceed total shares");
        
        // Approve TurboVault to spend stETH
        stETH.approve(turboVault, yieldShares);
        
        // Call TurboVault's depositYield function directly
        ITurboVault(turboVault).depositYield(yieldShares);
        
        emit YieldHarvested(block.timestamp, totalYield);
    }
    
    /**
     * @dev Public harvest function - allows anyone to harvest yield to TurboVault
     * This is a public version of harvestAndCompound for testing purposes
     */
    function harvestYield() external {
        uint256 totalYield = this.getTotalYield();
        require(totalYield > 0, "No yield to harvest");
        require(turboVault != address(0), "TurboVault not set");
        
        // Get current total stETH value and shares
        uint256 totalStETHShares = lido.sharesOf(address(this));
        uint256 currentTotalValue = lido.getPooledEthByShares(totalStETHShares);
        
        // Calculate yield as a percentage of total shares
        // yieldShares = (totalYield / currentTotalValue) * totalStETHShares
        uint256 yieldShares = (totalStETHShares * totalYield) / currentTotalValue;
        
        require(yieldShares > 0, "No yield shares to harvest");
        require(yieldShares <= totalStETHShares, "Yield shares exceed total shares");
        
        // Approve TurboVault to spend stETH
        stETH.approve(turboVault, yieldShares);
        
        // Call TurboVault's depositYield function directly
        ITurboVault(turboVault).depositYield(yieldShares);
        
        emit YieldHarvested(block.timestamp, totalYield);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get user's principal balance
     * @param user User address
     * @return Principal balance in ETH
     */
    function getUserPrincipal(address user) external view returns (uint256) {
        return principalBalance[user];
    }
    
    /**
     * @dev Get user's accumulated yield
     * @param user User address
     * @return Yield amount in ETH equivalent
     */
    function getUserYield(address user) public view returns (uint256) {
        if (userStETHShares[user] == 0) return 0;
        
        // Get current value of user's stETH shares
        uint256 currentSharesValue = lido.getPooledEthByShares(userStETHShares[user]);
        
        // Get user's original principal in ETH
        uint256 userPrincipal = principalBalance[user];
        
        // Subtract principal from current value to get yield
        if (currentSharesValue > userPrincipal) {
            return currentSharesValue - userPrincipal;
        }
        
        return 0;
    }
    
    /**
     * @dev Get total yield available across all users
     * @return Total yield in ETH equivalent
     */
    function getTotalYield() external view returns (uint256) {
        uint256 totalStETHValue = lido.getPooledEthByShares(lido.sharesOf(address(this)));
        if (totalStETHValue > totalPrincipal) {
            return totalStETHValue - totalPrincipal;
        }
        return 0;
    }
    
    
    
    /**
     * @dev Get user's actual withdrawable balance (same calculation as withdrawTotal uses)
     * @param user User address
     * @return Actual withdrawable balance in ETH
     */
    function getUserActualWithdrawableBalance(address user) external view returns (uint256) {
        if (userStETHShares[user] == 0) return 0;
        return lido.getPooledEthByShares(userStETHShares[user]);
    }
    
    /**
     * @dev Get user's claimable yield shares from TurboVault
     * This includes both Lido rewards and EigenLayer rewards
     * @param user User address
     * @return Claimable amount of TurboVault shares
     */
    function getClaimableYieldShares(address user) external view returns (uint256) {
        uint256 userPrincipal = principalBalance[user];
        if (userPrincipal == 0 || turboVault == address(0)) return 0;
        
        uint256 totalPrincipalAmount = totalPrincipal;
        
        // Get the total value of all rewards (Lido + EigenLayer) that users are entitled to
        uint256 totalRewardsValue = ITurboVault(turboVault).convertToAssets(
            ITurboVault(turboVault).balanceOf(address(this))
        );
        
        // Calculate the user's total entitlement based on their share of the principal
        uint256 totalEntitlement = (userPrincipal * totalRewardsValue) / totalPrincipalAmount;
        
        // Calculate how many TurboVault shares this entitlement represents
        uint256 totalEntitlementShares = ITurboVault(turboVault).convertToShares(totalEntitlement);
        
        // Return available shares (total entitlement minus already withdrawn)
        if (totalEntitlementShares > withdrawnYieldShares[user]) {
            return totalEntitlementShares - withdrawnYieldShares[user];
        }
        
        return 0;
    }
    
    /**
     * @dev Get user's total yield value including both Lido and EigenLayer rewards
     * This is the total value the user is entitled to from all rewards
     * @param user User address
     * @return Total yield value in ETH equivalent
     */
    function getUserTotalYieldValue(address user) external view returns (uint256) {
        uint256 userPrincipal = principalBalance[user];
        if (userPrincipal == 0 || turboVault == address(0)) return 0;
        
        uint256 totalPrincipalAmount = totalPrincipal;
        
        // Get the total value of all rewards (Lido + EigenLayer) that users are entitled to
        uint256 totalRewardsValue = ITurboVault(turboVault).convertToAssets(
            ITurboVault(turboVault).balanceOf(address(this))
        );
        
        // Calculate the user's total entitlement based on their share of the principal
        uint256 totalEntitlement = (userPrincipal * totalRewardsValue) / totalPrincipalAmount;
        
        return totalEntitlement;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Set deposit limits
     * @param _minDeposit Minimum deposit amount
     * @param _maxDeposit Maximum deposit amount
     */
    function setDepositLimits(uint256 _minDeposit, uint256 _maxDeposit) external onlyOwner {
        if (_minDeposit > _maxDeposit) revert InvalidAmount();
        
        minDeposit = _minDeposit;
        maxDeposit = _maxDeposit;
        
        emit LimitsUpdated(_minDeposit, _maxDeposit);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Set TurboVault address
     * @param _turboVault Address of the TurboVault contract
     */
    function setTurboVault(address _turboVault) external onlyOwner {
        require(_turboVault != address(0), "Invalid TurboVault address");
        turboVault = _turboVault;
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    /**
     * @dev Allow contract to receive ETH (needed for Lido withdrawals)
     */
    receive() external payable {}
}
