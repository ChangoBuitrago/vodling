// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";
import "../src/interfaces/ILido.sol";
import "../src/interfaces/IChainlinkOracle.sol";

// Mock contracts for testing
contract MockLido is ILido {
    uint256 public totalShares = 1000000 ether;
    uint256 public totalPooledEther = 1000000 ether;
    mapping(address => uint256) public sharesOf;
    
    function submit(address _referral) external payable override returns (uint256) {
        uint256 shares = msg.value; // 1:1 for simplicity in tests
        sharesOf[msg.sender] += shares;
        totalShares += shares;
        totalPooledEther += msg.value;
        return shares;
    }
    
    function getTotalShares() external view override returns (uint256) {
        return totalShares;
    }
    
    function getTotalPooledEther() external view override returns (uint256) {
        return totalPooledEther;
    }
    
    function sharesOf(address _account) external view override returns (uint256) {
        return sharesOf[_account];
    }
    
    function getSharesByPooledEth(uint256 _ethAmount) external view override returns (uint256) {
        return _ethAmount; // 1:1 for simplicity
    }
    
    function getPooledEthByShares(uint256 _sharesAmount) external view override returns (uint256) {
        return _sharesAmount; // 1:1 for simplicity
    }
}

contract MockStETH {
    mapping(address => uint256) public balanceOf;
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockChainlinkOracle is IChainlinkOracle {
    int256 public price = 2000 * 10**8; // $2000 ETH
    
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}

contract SafeVaultTest is Test {
    SafeVault public safeVault;
    MockLido public mockLido;
    MockStETH public mockStETH;
    MockChainlinkOracle public mockOracle;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    uint256 public constant INITIAL_ETH = 100 ether;
    
    function setUp() public {
        // Deploy mock contracts
        mockLido = new MockLido();
        mockStETH = new MockStETH();
        mockOracle = new MockChainlinkOracle();
        
        // Deploy SafeVault
        vm.prank(owner);
        safeVault = new SafeVault(
            address(mockLido),
            address(mockStETH),
            address(mockOracle)
        );
        
        // Fund users
        vm.deal(user1, INITIAL_ETH);
        vm.deal(user2, INITIAL_ETH);
    }
    
    // ============ Deposit Tests ============
    
    function testDeposit() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        assertEq(safeVault.getUserPrincipal(user1), depositAmount);
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
        
        assertEq(safeVault.getUserPrincipal(user1), deposit1);
        assertEq(safeVault.getUserPrincipal(user2), deposit2);
        assertEq(safeVault.totalPrincipal(), deposit1 + deposit2);
    }
    
    function testDepositBelowMinimum() public {
        uint256 depositAmount = 0.005 ether; // Below 0.01 ether minimum
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: depositAmount}(depositAmount);
    }
    
    function testDepositAboveMaximum() public {
        uint256 depositAmount = 2000 ether; // Above 1000 ether maximum
        
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
        
        assertEq(safeVault.getUserPrincipal(user1), 0.5 ether);
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
    
    function testWithdrawYield() public {
        uint256 depositAmount = 1 ether;
        
        // Deposit
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        // Simulate yield by increasing stETH value
        // In a real scenario, this would happen over time through staking rewards
        
        // For now, we'll test the function exists and works with zero yield
        uint256 yield = safeVault.getUserYield(user1);
        assertEq(yield, 0);
        
        // Try to withdraw yield (should work with 0 amount)
        vm.prank(user1);
        safeVault.withdrawYield(0);
    }
    
    // ============ View Function Tests ============
    
    function testGetUserTotalBalance() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        uint256 totalBalance = safeVault.getUserTotalBalance(user1);
        assertEq(totalBalance, depositAmount); // No yield yet
    }
    
    function testGetTotalYield() public {
        uint256 totalYield = safeVault.getTotalYield();
        assertEq(totalYield, 0); // No yield initially
    }
    
    function testGetETHPrice() public {
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
        vm.expectRevert("Pausable: paused");
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
        vm.expectRevert("Ownable: caller is not the owner");
        safeVault.emergencyRecover(address(mockStETH), 1 ether);
    }
    
    // ============ Access Control Tests ============
    
    function testOnlyOwnerFunctions() public {
        // Test setDepositLimits
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        safeVault.setDepositLimits(0.1 ether, 500 ether);
        
        // Test pause
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        safeVault.pause();
        
        // Test emergencyRecover
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        safeVault.emergencyRecover(address(mockStETH), 1 ether);
    }
    
    // ============ Event Tests ============
    
    function testDepositEvent() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit SafeVault.Deposit(user1, depositAmount, depositAmount);
        safeVault.deposit{value: depositAmount}(depositAmount);
    }
    
    function testWithdrawPrincipalEvent() public {
        uint256 depositAmount = 1 ether;
        uint256 withdrawAmount = 0.5 ether;
        
        // Deposit first
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}(depositAmount);
        
        // Withdraw
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit SafeVault.WithdrawPrincipal(user1, withdrawAmount, withdrawAmount);
        safeVault.withdrawPrincipal(withdrawAmount);
    }
    
    function testLimitsUpdatedEvent() public {
        uint256 newMin = 0.1 ether;
        uint256 newMax = 500 ether;
        
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit SafeVault.LimitsUpdated(newMin, newMax);
        safeVault.setDepositLimits(newMin, newMax);
    }
}
