// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ILido.sol";
import "./interfaces/IChainlinkOracle.sol";

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
    
    /// @dev Chainlink price feed for ETH/USD
    IChainlinkOracle public immutable ethPriceFeed;
    
    /// @dev Total principal deposited by all users
    uint256 public totalPrincipal;
    
    /// @dev Mapping of user address to their principal balance
    mapping(address => uint256) public principalBalance;
    
    /// @dev Mapping of user address to their stETH shares at deposit time
    mapping(address => uint256) public userStETHShares;
    
    /// @dev Mapping of user address to their original principal in ETH (for yield calculation)
    mapping(address => uint256) public userPrincipalETH;
    
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
    
    // ============ Errors ============
    
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidPriceFeed();
    
    // ============ Constructor ============
    
    constructor(
        address _lido,
        address _stETH,
        address _ethPriceFeed
    ) Ownable(msg.sender) {
        if (_lido == address(0) || _stETH == address(0) || _ethPriceFeed == address(0)) {
            revert InvalidAmount();
        }
        
        lido = ILido(_lido);
        stETH = IERC20(_stETH);
        ethPriceFeed = IChainlinkOracle(_ethPriceFeed);
    }
    
    // ============ External Functions ============
    
    /**
     * @dev Deposit ETH and stake via Lido
     * @param amount Amount of ETH to deposit
     */
    function deposit(uint256 amount) external payable nonReentrant whenNotPaused {
        if (msg.value != amount) revert InvalidAmount();
        if (amount < minDeposit || amount > maxDeposit) revert InvalidAmount();
        
        // Get current stETH shares before deposit
        uint256 sharesBefore = lido.sharesOf(address(this));
        
        // Stake ETH with Lido
        uint256 stETHSharesReceived = lido.submit{value: amount}(address(0));
        
        // Update user's principal balance and track their stETH shares
        principalBalance[msg.sender] = principalBalance[msg.sender] + amount;
        userStETHShares[msg.sender] = userStETHShares[msg.sender] + stETHSharesReceived;
        userPrincipalETH[msg.sender] = userPrincipalETH[msg.sender] + amount;
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
        userPrincipalETH[msg.sender] = userPrincipalETH[msg.sender] - amount;
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
        uint256 principalToReduce = (userPrincipalETH[msg.sender] * amount) / totalBalance;
        
        // Get the actual ETH amount that will be received from Lido
        uint256 actualEthAmount = lido.getPooledEthByShares(sharesToWithdraw);
        
        // Update user's balances
        userStETHShares[msg.sender] = userStETHShares[msg.sender] - sharesToWithdraw;
        userPrincipalETH[msg.sender] = userPrincipalETH[msg.sender] - principalToReduce;
        principalBalance[msg.sender] = principalBalance[msg.sender] - principalToReduce;
        totalPrincipal = totalPrincipal - principalToReduce;
        
        // Withdraw ETH from Lido (this will burn stETH and send ETH to this contract)
        lido.withdraw(sharesToWithdraw);
        
        // Send the actual ETH amount received from Lido to user
        (bool success, ) = payable(msg.sender).call{value: actualEthAmount}("");
        if (!success) revert TransferFailed();
        
        emit WithdrawTotal(msg.sender, actualEthAmount, sharesToWithdraw);
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
        uint256 userPrincipal = userPrincipalETH[user];
        
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
     * @dev Get current ETH price from Chainlink
     * @return ETH price in USD (8 decimals)
     */
    function getETHPrice() external view returns (int256) {
        (, int256 price, , , ) = ethPriceFeed.latestRoundData();
        return price;
    }
    
    /**
     * @dev Get user's total balance (principal + yield)
     * @param user User address
     * @return Total balance in ETH equivalent
     */
    function getUserTotalBalance(address user) external view returns (uint256) {
        return principalBalance[user] + getUserYield(user);
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
