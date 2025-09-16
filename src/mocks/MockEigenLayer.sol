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
        
        // Calculate stETH amount (1:1 ratio for simplicity)
        amount = shares;
        require(userStaked[msg.sender] >= amount, "Insufficient staked amount");
        
        // Burn shares
        _burn(msg.sender, shares);
        
        // Update tracking
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        
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
    
    // ============ Events ============
    
    event Staked(address indexed user, uint256 amount, uint256 shares);
    event Unstaked(address indexed user, uint256 amount, uint256 shares);
}
