// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockEigenLayer
 * @dev Mock implementation of EigenLayer for local testing
 * This simulates the EigenLayer restaking mechanism where users can stake stETH
 * and receive additional yield through AVS (Actively Validated Services)
 */
contract MockEigenLayer is ERC20, Ownable {
    uint256 public constant YIELD_RATE_PER_DAY = 2e15; // 0.2% per day (higher than Lido for testing)
    
    uint256 public lastUpdateTime;
    uint256 public totalStaked;
    
    // Mapping to track user's staked amount
    mapping(address => uint256) public userStaked;
    
    // The stETH token that users stake
    IERC20 public immutable stETH;
    
    constructor(address _stETH) ERC20("Mock EigenLayer stETH", "meigstETH") Ownable(msg.sender) {
        stETH = IERC20(_stETH);
        lastUpdateTime = block.timestamp;
        totalStaked = 0;
    }
    
    /**
     * @dev Stake stETH tokens to receive EigenLayer rewards
     * @param amount Amount of stETH to stake
     * @return shares Number of EigenLayer shares received
     */
    function stake(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Update rewards before staking
        _updateRewards();
        
        // Transfer stETH from user to this contract
        require(stETH.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Mint shares 1:1 with stETH (simplified for testing)
        shares = amount;
        _mint(msg.sender, shares);
        
        // Update tracking
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, shares);
        
        return shares;
    }
    
    /**
     * @dev Unstake EigenLayer shares and receive stETH back
     * @param shares Number of shares to unstake
     * @return amount Amount of stETH received
     */
    function unstake(uint256 shares) external returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        // Update rewards before unstaking
        _updateRewards();
        
        // Calculate the original staked amount for these shares
        uint256 userTotalShares = balanceOf(msg.sender);
        uint256 originalStakedAmount;
        if (userTotalShares > 0) {
            originalStakedAmount = (userStaked[msg.sender] * shares) / userTotalShares;
        } else {
            // If withdrawing all shares, use the full original staked amount
            originalStakedAmount = userStaked[msg.sender];
        }
        
        // For this mock implementation, we only return the original staked amount
        // The yield is represented by the increased share value, not additional stETH
        amount = originalStakedAmount;
        require(amount > 0, "No value to withdraw");
        
        // Burn shares
        _burn(msg.sender, shares);
        
        // Update tracking
        userStaked[msg.sender] -= originalStakedAmount;
        totalStaked -= originalStakedAmount;
        
        // Transfer stETH back to user
        require(stETH.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount, shares);
        
        return amount;
    }
    
    /**
     * @dev Get the current value of shares including accumulated rewards
     * @param shares Number of shares
     * @return value Current value in stETH terms
     */
    function getSharesValue(uint256 shares) external view returns (uint256 value) {
        if (totalSupply() == 0 || totalStaked == 0) return shares;
        
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime > lastUpdateTime ? currentTime - lastUpdateTime : 0;
        
        // Calculate accumulated rewards
        uint256 rewardsMultiplier = 1e18 + (YIELD_RATE_PER_DAY * timeElapsed) / 1 days;
        uint256 currentTotalValue = (totalStaked * rewardsMultiplier) / 1e18;
        
        // Calculate user's share of the total value
        return (shares * currentTotalValue) / totalSupply();
    }
    
    /**
     * @dev Get total value including rewards
     * @return Total value in stETH terms
     */
    function getTotalValue() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime > lastUpdateTime ? currentTime - lastUpdateTime : 0;
        
        uint256 rewardsMultiplier = 1e18 + (YIELD_RATE_PER_DAY * timeElapsed) / 1 days;
        return (totalStaked * rewardsMultiplier) / 1e18;
    }
    
    /**
     * @dev Get user's total value including rewards
     * @param user User address
     * @return Total value in stETH terms
     */
    function getUserValue(address user) external view returns (uint256) {
        uint256 shares = balanceOf(user);
        return this.getSharesValue(shares);
    }
    
    /**
     * @dev Get user's accumulated rewards
     * @param user User address
     * @return Rewards in stETH terms
     */
    function getUserRewards(address user) external view returns (uint256) {
        uint256 totalValue = this.getUserValue(user);
        uint256 stakedAmount = userStaked[user];
        return totalValue > stakedAmount ? totalValue - stakedAmount : 0;
    }
    
    /**
     * @dev Update rewards (internal function)
     * Simplified - just update timestamp, rewards calculated on-demand
     */
    function _updateRewards() internal {
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Manually update rewards (for testing)
     */
    function updateRewards() external {
        _updateRewards();
    }
    
    /**
     * @dev Fast forward time for testing
     * @param _seconds Number of seconds to fast forward
     */
    function fastForwardTime(uint256 _seconds) external {
        lastUpdateTime += _seconds;
    }
    
    /**
     * @dev Generate yield by simulating time passage
     * This simulates EigenLayer rewards accumulation
     * @param _days Number of days to simulate
     */
    function generateYield(uint256 _days) external {
        require(_days > 0, "Days must be greater than 0");
        
        // Fast forward time to simulate yield generation
        uint256 secondsToAdd = _days * 1 days;
        lastUpdateTime += secondsToAdd;
        
        // Actually generate yield by increasing the total staked amount
        // This simulates EigenLayer rewards being added to the pool
        if (totalStaked > 0) {
            // Calculate yield: 1% per day (same as Lido for consistency)
            uint256 yieldMultiplier = 1e18 + (1e16 * _days); // 1% per day
            uint256 newTotalStaked = (totalStaked * yieldMultiplier) / 1e18;
            
            // Update total staked with yield
            totalStaked = newTotalStaked;
            
            // Emit event with the actual yield generated
            emit YieldGenerated(_days, this.getTotalValue());
        }
    }
    
    // ============ Events ============
    
    event Staked(address indexed user, uint256 amount, uint256 shares);
    event Unstaked(address indexed user, uint256 amount, uint256 shares);
    event YieldGenerated(uint256 _days, uint256 totalValue);
}
