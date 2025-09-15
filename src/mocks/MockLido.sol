// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/ILido.sol";

/**
 * @title MockLido
 * @dev Mock implementation of Lido for local testing
 */
contract MockLido is ERC20, ILido {
    uint256 public constant SHARES_PER_TOKEN = 1e18;
    uint256 public constant YIELD_RATE_PER_DAY = 1e16; // 1% per day (10000 basis points) - higher for testing
    
    uint256 public lastUpdateTime;
    uint256 public totalPooledEth;
    
    constructor() ERC20("Mock stETH", "stETH") {
        lastUpdateTime = block.timestamp;
        totalPooledEth = 0;
    }
    
    /**
     * @dev Submit ETH and get stETH tokens (1:1 ratio for simplicity)
     */
    function submit(address /* _referral */) external payable returns (uint256) {
        _updateYield();
        uint256 shares = msg.value;
        _mint(msg.sender, shares);
        totalPooledEth += msg.value;
        return shares;
    }
    
    /**
     * @dev Get shares for a given amount of ETH
     */
    function getSharesByPooledEth(uint256 _ethAmount) external pure returns (uint256) {
        return _ethAmount;
    }
    
    /**
     * @dev Get ETH amount for given shares (with yield applied)
     */
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256) {
        if (totalSupply() == 0) return _sharesAmount;
        
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime > lastUpdateTime ? currentTime - lastUpdateTime : 0;
        
        // Calculate yield: 1% per day
        uint256 yieldMultiplier = 1e18 + (YIELD_RATE_PER_DAY * timeElapsed) / 1 days;
        
        // Apply yield to total pooled ETH
        uint256 currentTotalPooledEth = (totalPooledEth * yieldMultiplier) / 1e18;
        
        // Calculate user's share of the yield
        return (_sharesAmount * currentTotalPooledEth) / totalSupply();
    }
    
    /**
     * @dev Get shares of an account
     */
    function sharesOf(address _account) external view returns (uint256) {
        return balanceOf(_account);
    }
    
    /**
     * @dev Get total shares
     */
    function getTotalShares() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @dev Get total pooled ETH (with yield applied)
     */
    function getTotalPooledEther() external view returns (uint256) {
        if (totalPooledEth == 0) return address(this).balance;
        
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime > lastUpdateTime ? currentTime - lastUpdateTime : 0;
        
        // Calculate yield: 1% per day
        uint256 yieldMultiplier = 1e18 + (YIELD_RATE_PER_DAY * timeElapsed) / 1 days;
        
        // Apply yield to total pooled ETH
        return (totalPooledEth * yieldMultiplier) / 1e18;
    }
    
    /**
     * @dev Internal function to update yield (called on deposits)
     */
    function _updateYield() internal {
        if (totalPooledEth > 0) {
            uint256 currentTime = block.timestamp;
            uint256 timeElapsed = currentTime > lastUpdateTime ? currentTime - lastUpdateTime : 0;
            
            // Calculate yield: 1% per day
            uint256 yieldMultiplier = 1e18 + (YIELD_RATE_PER_DAY * timeElapsed) / 1 days;
            
            // Update total pooled ETH with yield
            totalPooledEth = (totalPooledEth * yieldMultiplier) / 1e18;
        }
        
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Manually trigger yield update (for testing)
     */
    function updateYield() external {
        _updateYield();
    }
    
    /**
     * @dev Fast forward time for testing (only in mock)
     */
    function fastForwardTime(uint256 _seconds) external {
        // Apply yield immediately by updating the total pooled ETH
        if (totalPooledEth > 0) {
            // Calculate yield: 1% per day
            uint256 yieldMultiplier = 1e18 + (YIELD_RATE_PER_DAY * _seconds) / 1 days;
            
            // Update total pooled ETH with yield
            totalPooledEth = (totalPooledEth * yieldMultiplier) / 1e18;
        }
        
        // Update the last update time to reflect the fast forward
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Convert stETH back to ETH (for testing purposes)
     * In real Lido, this would require going through the unstaking queue
     */
    function withdraw(uint256 _sharesAmount) external {
        require(balanceOf(msg.sender) >= _sharesAmount, "Insufficient stETH balance");
        
        // Calculate ETH amount based on current exchange rate
        uint256 ethAmount = this.getPooledEthByShares(_sharesAmount);
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");
        
        // Burn the stETH tokens
        _burn(msg.sender, _sharesAmount);
        
        // Update total pooled ETH
        totalPooledEth -= ethAmount;
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
}
