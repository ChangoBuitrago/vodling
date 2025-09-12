// ======================================================
// FILE: script/DeployLocal.s.sol
// ======================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";
import "../src/mocks/MockLido.sol";
import "../src/mocks/MockChainlinkOracle.sol";

contract DeployLocalScript is Script {
    function run() external {
        // Use test private key for local development
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to LOCAL DEVELOPMENT");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock contracts
        console.log("\n=== Deploying Mock Contracts ===");
        
        MockLido mockLido = new MockLido();
        console.log("MockLido deployed at:", address(mockLido));
        
        MockChainlinkOracle mockPriceFeed = new MockChainlinkOracle();
        console.log("MockChainlinkOracle deployed at:", address(mockPriceFeed));
        
        // Deploy SafeVault with mock contracts
        console.log("\n=== Deploying SafeVault ===");
        
        SafeVault safeVault = new SafeVault(
            address(mockLido), // lido
            address(mockLido), // stETH (same as lido in our mock)
            address(mockPriceFeed) // ethPriceFeed
        );
        
        console.log("SafeVault deployed at:", address(safeVault));
        console.log("Owner:", safeVault.owner());
        console.log("Min deposit:", safeVault.minDeposit());
        console.log("Max deposit:", safeVault.maxDeposit());
        
        // Send some ETH to the mock Lido contract for testing
        payable(address(mockLido)).transfer(100 ether);
        console.log("Sent 100 ETH to MockLido for testing");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("MockLido:", address(mockLido));
        console.log("MockChainlinkOracle:", address(mockPriceFeed));
        console.log("SafeVault:", address(safeVault));
        console.log("\nContracts deployed successfully!");
        console.log("Run 'node setup/update-contracts.js' to update frontend config automatically.");
    }
}



// ======================================================
// FILE: src/mocks/MockLido.sol
// ======================================================
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
        // This is a deprecated way to handle time. `vm.warp` is preferred.
        // However, to fix the logic, we just adjust the last update time.
        // The next call to _updateYield() will then calculate the interest
        // over the simulated elapsed time.
        lastUpdateTime -= _seconds;
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



// ======================================================
// FILE: src/mocks/MockChainlinkOracle.sol
// ======================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockChainlinkOracle
 * @dev Mock implementation of Chainlink price feed for local testing
 */
contract MockChainlinkOracle {
    int256 public latestAnswer = 2000e8; // $2000 ETH price with 8 decimals
    
    /**
     * @dev Get the latest price (mock implementation)
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            latestAnswer, // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }
    
    /**
     * @dev Set mock price for testing
     */
    function setPrice(int256 _price) external {
        latestAnswer = _price;
    }
}



// ======================================================
// FILE: src/SafeVault.sol
// ======================================================
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
     * @dev Get current ETH price from Chainlink
     * @return ETH price in USD (8 decimals)
     */
    function getETHPrice() external view returns (int256) {
        (, int256 price, , , ) = ethPriceFeed.latestRoundData();
        return price;
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



// ======================================================
// FILE: src/interfaces/IChainlinkOracle.sol
// ======================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IChainlinkOracle {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}



// ======================================================
// FILE: src/interfaces/ILido.sol
// ======================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILido {
    function submit(address _referral) external payable returns (uint256);
    function withdraw(uint256 _sharesAmount) external;
    function getTotalShares() external view returns (uint256);
    function getTotalPooledEther() external view returns (uint256);
    function sharesOf(address _account) external view returns (uint256);
    function getSharesByPooledEth(uint256 _ethAmount) external view returns (uint256);
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256);
}



// ======================================================
// FILE: test/SafeVault.t.sol
// ======================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";
// ADD THESE IMPORTS
import "../src/mocks/MockLido.sol";
import "../src/mocks/MockChainlinkOracle.sol";
// Keep these interfaces
import "../src/interfaces/ILido.sol";
import "../src/interfaces/IChainlinkOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SafeVaultTest is Test {
    SafeVault public safeVault;
    // CHANGE mockLido and mockStETH declarations
    MockLido public mockLido;
    IERC20 public mockStETH; // Use IERC20 interface
    MockChainlinkOracle public mockOracle;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    uint256 public constant INITIAL_ETH = 100 ether;
    
    function setUp() public {
        // Deploy mock contracts
        mockLido = new MockLido();
        mockStETH = IERC20(address(mockLido)); // The mock is also the stETH token
        mockOracle = new MockChainlinkOracle();
        
        // Deploy SafeVault
        vm.prank(owner);
        safeVault = new SafeVault(
            address(mockLido),
            address(mockStETH), // Pass the same address
            address(mockOracle)
        );
        
        // Fund users and the mock Lido contract so it can handle withdrawals
        vm.deal(user1, INITIAL_ETH);
        vm.deal(user2, INITIAL_ETH);
        vm.deal(address(mockLido), 100 ether); // Fund Lido for withdrawals
    }
    
    // ============ Deposit Tests ============
    
    function testDeposit() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        assertEq(safeVault.principalBalance(user1), depositAmount);
        assertEq(safeVault.totalPrincipal(), depositAmount);
        assertEq(safeVault.userStETHShares(user1), depositAmount);
    }
    
    function testDepositMultipleUsers() public {
        uint256 deposit1 = 1 ether;
        uint256 deposit2 = 2 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: deposit1}(deposit1);
        
        vm.prank(user2);
        safeVault.deposit{value: deposit2}(deposit2);
        
        assertEq(safeVault.principalBalance(user1), deposit1);
        assertEq(safeVault.principalBalance(user2), deposit2);
        assertEq(safeVault.totalPrincipal(), deposit1 + deposit2);
    }
    
    function testDepositBelowMinimum() public {
        uint256 depositAmount = 0.0005 ether; // Below 0.001 ether minimum
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: depositAmount}(depositAmount);
    }
    
    function testDepositAboveMaximum() public {
        uint256 depositAmount = 2000 ether; // Above 1000 ether maximum
        
        // Give user1 enough ETH
        vm.deal(user1, depositAmount);
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: depositAmount}(depositAmount);
    }
    
    function testDepositWrongValue() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: 0.5 ether}(depositAmount);
    }
    
    // ============ Withdrawal Tests ============
    
    function testWithdrawPrincipal() public {
        uint256 depositAmount = 1 ether;
        
        // Deposit first
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        // Withdraw half
        uint256 withdrawAmount = 0.5 ether;
        vm.prank(user1);
        safeVault.withdrawPrincipal(withdrawAmount);
        
        assertEq(safeVault.principalBalance(user1), 0.5 ether);
        assertEq(safeVault.totalPrincipal(), 0.5 ether);
    }
    
    function testWithdrawPrincipalInsufficientBalance() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        uint256 withdrawAmount = 2 ether;
        vm.prank(user1);
        vm.expectRevert(SafeVault.InsufficientBalance.selector);
        safeVault.withdrawPrincipal(withdrawAmount);
    }
    
    // Add these new test functions to your SafeVaultTest contract

    function test_Yield_AccruesOverTime() public {
        uint256 depositAmount = 1 ether;

        // User 1 deposits 1 ETH
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);

        // Initially, yield should be zero
        assertEq(safeVault.getUserYield(user1), 0, "Initial yield should be 0");

        // Simulate 30 days passing by fast-forwarding the block timestamp
        uint256 thirtyDays = 30 days;
        vm.warp(block.timestamp + thirtyDays);

        // To see the yield, the mock's state needs to be updated.
        // We can trigger this by calling the public updateYield function.
        mockLido.updateYield();

        // Now, the user's yield should be greater than zero
        uint256 yield = safeVault.getUserYield(user1);
        assertTrue(yield > 0, "Yield after 30 days should be positive");

        console.log("User 1 Yield after 30 days:", yield);
    }

    function test_Withdraw_TotalBalanceWithYield() public {
        uint256 depositAmount = 10 ether;
        uint256 user1InitialBalance = address(user1).balance;

        // User 1 deposits 10 ETH
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);

        // Simulate 365 days of yield
        vm.warp(block.timestamp + 365 days);
        mockLido.updateYield();

        // Get the user's total balance (principal + yield)
        uint256 totalBalance = safeVault.getUserActualWithdrawableBalance(user1);
        assertTrue(totalBalance > depositAmount, "Total balance must be greater than initial deposit");

        // User 1 withdraws their entire balance
        vm.prank(user1);
        safeVault.withdrawTotal(totalBalance);

        // Check user's final ETH balance
        uint256 user1FinalBalance = address(user1).balance;
        // The final balance should be approximately the initial balance minus gas costs
        // and plus the yield, since they got their principal back.
        assertTrue(user1FinalBalance > user1InitialBalance - 0.1 ether, "User's final balance should reflect returned principal + yield");
        assertEq(safeVault.principalBalance(user1), 0, "User principal should be zero after full withdrawal");
    }
    
    // ============ View Function Tests ============
    
    function testGetUserTotalBalance() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        uint256 totalBalance = safeVault.getUserActualWithdrawableBalance(user1);
        assertEq(totalBalance, depositAmount); // No yield yet
    }
    
    function testGetTotalYield() public view {
        uint256 totalYield = safeVault.getTotalYield();
        assertEq(totalYield, 0); // No yield initially
    }
    
    function testGetETHPrice() public view {
        int256 price = safeVault.getETHPrice();
        assertEq(price, 2000 * 10**8); // $2000 from mock
    }
    
    // ============ Admin Function Tests ============
    
    function testSetDepositLimits() public {
        uint256 newMin = 0.1 ether;
        uint256 newMax = 500 ether;
        
        vm.prank(owner);
        safeVault.setDepositLimits(newMin, newMax);
        
        assertEq(safeVault.minDeposit(), newMin);
        assertEq(safeVault.maxDeposit(), newMax);
    }
    
    function testSetDepositLimitsInvalid() public {
        uint256 newMin = 1 ether;
        uint256 newMax = 0.5 ether; // Max < Min
        
        vm.prank(owner);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.setDepositLimits(newMin, newMax);
    }
    
    function testPauseUnpause() public {
        // Pause
        vm.prank(owner);
        safeVault.pause();
        
        // Try to deposit while paused
        vm.prank(user1);
        vm.expectRevert();
        safeVault.deposit{value: 1 ether}(1 ether);
        
        // Unpause
        vm.prank(owner);
        safeVault.unpause();
        
        // Should work now
        vm.prank(user1);
        safeVault.deposit{value: 1 ether}(1 ether);
    }
    
    function testEmergencyRecover() public {
        // This would require setting up a token with balance in the contract
        // For now, just test the function exists and is owner-only
        vm.prank(user1);
        vm.expectRevert();
        safeVault.emergencyRecover(address(mockStETH), 1 ether);
    }
    
    // ============ Access Control Tests ============
    
    function testOnlyOwnerFunctions() public {
        // Test setDepositLimits
        vm.prank(user1);
        vm.expectRevert();
        safeVault.setDepositLimits(0.1 ether, 500 ether);
        
        // Test pause
        vm.prank(user1);
        vm.expectRevert();
        safeVault.pause();
        
        // Test emergencyRecover
        vm.prank(user1);
        vm.expectRevert();
        safeVault.emergencyRecover(address(mockStETH), 1 ether);
    }
    
    // ============ Event Tests ============
    
    function testDepositEvent() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        // Just test that deposit works, event testing can be added later
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        // Verify the deposit was successful
        assertEq(safeVault.principalBalance(user1), depositAmount);
    }
    
    function testWithdrawPrincipalEvent() public {
        uint256 depositAmount = 1 ether;
        uint256 withdrawAmount = 0.5 ether;
        
        // Deposit first
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        // Withdraw
        vm.prank(user1);
        safeVault.withdrawPrincipal(withdrawAmount);
        
        // Verify the withdrawal was successful
        assertEq(safeVault.principalBalance(user1), depositAmount - withdrawAmount);
    }
    
    function testLimitsUpdatedEvent() public {
        uint256 newMin = 0.1 ether;
        uint256 newMax = 500 ether;
        
        vm.prank(owner);
        safeVault.setDepositLimits(newMin, newMax);
        
        // Verify the limits were updated
        assertEq(safeVault.minDeposit(), newMin);
        assertEq(safeVault.maxDeposit(), newMax);
    }
}



