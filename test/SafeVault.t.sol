// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/SafeVault.sol";
// ADD THESE IMPORTS
import "../src/mocks/MockLido.sol";
// Keep these interfaces
import "../src/interfaces/ILido.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Event definitions for testing
interface ISafeVaultEvents {
    event Deposit(address indexed user, uint256 amount, uint256 stETHShares);
    event WithdrawPrincipal(address indexed user, uint256 amount, uint256 stETHShares);
    event WithdrawTotal(address indexed user, uint256 amount, uint256 stETHShares);
    event LimitsUpdated(uint256 minDeposit, uint256 maxDeposit);
}

contract SafeVaultTest is Test, ISafeVaultEvents {
    SafeVault public safeVault;
    // CHANGE mockLido and mockStETH declarations
    MockLido public mockLido;
    IERC20 public mockStETH; // Use IERC20 interface
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    uint256 public constant INITIAL_ETH = 100 ether;
    
    function setUp() public {
        // Deploy mock contracts
        mockLido = new MockLido();
        mockStETH = IERC20(address(mockLido)); // The mock is also the stETH token
        
        // Deploy SafeVault
        vm.prank(owner);
        safeVault = new SafeVault(
            address(mockLido),
            address(mockStETH) // Pass the same address
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
        safeVault.deposit{value: depositAmount}();
        
        assertEq(safeVault.principalBalance(user1), depositAmount);
        assertEq(safeVault.totalPrincipal(), depositAmount);
        assertEq(safeVault.userStETHShares(user1), depositAmount);
    }
    
    function testDepositMultipleUsers() public {
        uint256 deposit1 = 1 ether;
        uint256 deposit2 = 2 ether;
        
        vm.prank(user1);
        safeVault.deposit{value: deposit1}();
        
        vm.prank(user2);
        safeVault.deposit{value: deposit2}();
        
        assertEq(safeVault.principalBalance(user1), deposit1);
        assertEq(safeVault.principalBalance(user2), deposit2);
        assertEq(safeVault.totalPrincipal(), deposit1 + deposit2);
    }
    
    function testDepositBelowMinimum() public {
        uint256 depositAmount = 0.0005 ether; // Below 0.001 ether minimum
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: depositAmount}();
    }
    
    function testDepositAboveMaximum() public {
        uint256 depositAmount = 2000 ether; // Above 1000 ether maximum
        
        // Give user1 enough ETH
        vm.deal(user1, depositAmount);
        
        vm.prank(user1);
        vm.expectRevert(SafeVault.InvalidAmount.selector);
        safeVault.deposit{value: depositAmount}();
    }
    
    
    // ============ Withdrawal Tests ============
    
    function testWithdrawPrincipal() public {
        uint256 depositAmount = 1 ether;
        
        // Deposit first
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}();
        
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
        safeVault.deposit{value: depositAmount}();
        
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
        safeVault.deposit{value: depositAmount}();

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
        safeVault.deposit{value: depositAmount}();

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
        safeVault.deposit{value: depositAmount}();
        
        uint256 totalBalance = safeVault.getUserActualWithdrawableBalance(user1);
        assertEq(totalBalance, depositAmount); // No yield yet
    }
    
    function testGetTotalYield() public view {
        uint256 totalYield = safeVault.getTotalYield();
        assertEq(totalYield, 0); // No yield initially
    }
    
    // function testGetETHPrice() public view {
    //     int256 price = safeVault.getETHPrice();
    //     assertEq(price, 2000 * 10**8); // $2000 from mock
    // }
    
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
        safeVault.deposit{value: 1 ether}();
        
        // Unpause
        vm.prank(owner);
        safeVault.unpause();
        
        // Should work now
        vm.prank(user1);
        safeVault.deposit{value: 1 ether}();
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
        
        // Expect the Deposit event to be emitted with correct parameters
        vm.expectEmit(true, true, false, true);
        emit Deposit(user1, depositAmount, depositAmount);
        
        // Perform the deposit
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}();
        
        // Verify the deposit was successful
        assertEq(safeVault.principalBalance(user1), depositAmount);
    }
    
    function testWithdrawPrincipalEvent() public {
        uint256 depositAmount = 1 ether;
        uint256 withdrawAmount = 0.5 ether;
        
        // Deposit first
        vm.prank(user1);
        safeVault.deposit{value: depositAmount}();
        
        // Expect the WithdrawPrincipal event to be emitted
        vm.expectEmit(true, true, false, true);
        emit WithdrawPrincipal(user1, withdrawAmount, withdrawAmount);
        
        // Withdraw
        vm.prank(user1);
        safeVault.withdrawPrincipal(withdrawAmount);
        
        // Verify the withdrawal was successful
        assertEq(safeVault.principalBalance(user1), depositAmount - withdrawAmount);
    }
    
    function testLimitsUpdatedEvent() public {
        uint256 newMin = 0.1 ether;
        uint256 newMax = 500 ether;
        
        // Expect the LimitsUpdated event to be emitted
        vm.expectEmit(false, false, false, true);
        emit LimitsUpdated(newMin, newMax);
        
        vm.prank(owner);
        safeVault.setDepositLimits(newMin, newMax);
        
        // Verify the limits were updated
        assertEq(safeVault.minDeposit(), newMin);
        assertEq(safeVault.maxDeposit(), newMax);
    }
}
