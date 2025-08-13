// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";
import "../src/MockERC20.sol";

/**
 * @title PiggyBankFactoryTest
 * @dev Comprehensive test suite for PiggyBankFactory and PiggyBank contracts
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract PiggyBankFactoryTest is Test {
    PiggyBankFactory public factory;
    MockERC20 public token;
    
    address public admin;
    address public user1;
    address public user2;
    
    uint256 public constant LOCK_PERIOD_1 = 1 days;
    uint256 public constant LOCK_PERIOD_2 = 7 days;
    uint256 public constant LOCK_PERIOD_3 = 30 days;
    
    event PiggyBankCreated(
        address indexed user,
        address indexed piggyBank,
        address indexed token,
        uint256 lockPeriod,
        uint256 timestamp
    );

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy factory
        factory = new PiggyBankFactory();

        // Deploy mock ERC20 token
        token = new MockERC20("Test Token", "TEST", 18, 1000000);

        // Give users some ETH and tokens
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);

        token.mint(user1, 10000 * 10**18);
        token.mint(user2, 10000 * 10**18);
    }

    // Receive function to accept ETH (needed for admin penalty withdrawals)
    receive() external payable {}

    // ============ Factory Tests ============

    function testFactoryDeployment() public {
        assertEq(factory.admin(), admin);
        assertEq(factory.totalPiggyBanks(), 0);
    }

    function testCreateETHPiggyBank() public {
        vm.startPrank(user1);

        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);

        vm.stopPrank();
        
        // Verify factory state
        assertEq(factory.totalPiggyBanks(), 1);
        assertEq(factory.userPiggyBankCount(user1), 1);
        
        address[] memory userBanks = factory.getUserPiggyBanks(user1);
        assertEq(userBanks.length, 1);
        assertEq(userBanks[0], piggyBank);
        
        // Verify piggy bank properties
        PiggyBank bank = PiggyBank(payable(piggyBank));
        assertEq(bank.owner(), user1);
        assertEq(bank.factory(), address(factory));
        assertEq(bank.token(), address(0));
        assertEq(bank.lockPeriod(), LOCK_PERIOD_1);
        assertTrue(bank.isEthBank());
    }

    function testCreateTokenPiggyBank() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_2);
        
        vm.stopPrank();
        
        // Verify factory state
        assertEq(factory.totalPiggyBanks(), 1);
        assertEq(factory.userPiggyBankCount(user1), 1);
        
        // Verify piggy bank properties
        PiggyBank bank = PiggyBank(payable(piggyBank));
        assertEq(bank.owner(), user1);
        assertEq(bank.token(), address(token));
        assertEq(bank.lockPeriod(), LOCK_PERIOD_2);
        assertFalse(bank.isEthBank());
    }

    function testCreateMultiplePiggyBanks() public {
        vm.startPrank(user1);
        
        // Create ETH piggy bank
        address ethBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        
        // Create token piggy bank
        address tokenBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_2);
        
        // Create another ETH piggy bank with different lock period
        address ethBank2 = factory.createETHPiggyBank(LOCK_PERIOD_3);
        
        vm.stopPrank();
        
        // Verify factory state
        assertEq(factory.totalPiggyBanks(), 3);
        assertEq(factory.userPiggyBankCount(user1), 3);
        
        address[] memory userBanks = factory.getUserPiggyBanks(user1);
        assertEq(userBanks.length, 3);
        assertEq(userBanks[0], ethBank);
        assertEq(userBanks[1], tokenBank);
        assertEq(userBanks[2], ethBank2);
    }

    function test_RevertWhen_CreatePiggyBankWithZeroLockPeriod() public {
        vm.prank(user1);
        vm.expectRevert(PiggyBankFactory.InvalidLockPeriod.selector);
        factory.createETHPiggyBank(0);
    }

    function test_RevertWhen_CreateTokenPiggyBankWithZeroAddress() public {
        vm.prank(user1);
        vm.expectRevert(PiggyBankFactory.InvalidToken.selector);
        factory.createTokenPiggyBank(address(0), LOCK_PERIOD_1);
    }

    // ============ PiggyBank ETH Tests ============

    function testETHDeposit() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Deposit ETH
        uint256 depositAmount = 5 ether;
        bank.depositETH{value: depositAmount}();
        
        vm.stopPrank();
        
        assertEq(bank.getBalance(), depositAmount);
        assertEq(bank.totalDeposits(), depositAmount);
    }

    function testETHDepositViaReceive() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        
        // Deposit ETH via receive function
        uint256 depositAmount = 3 ether;
        (bool success,) = payable(piggyBank).call{value: depositAmount}("");
        assertTrue(success);
        
        vm.stopPrank();
        
        PiggyBank bank = PiggyBank(payable(piggyBank));
        assertEq(bank.getBalance(), depositAmount);
    }

    function testETHWithdrawAfterLockPeriod() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Deposit ETH
        uint256 depositAmount = 5 ether;
        bank.depositETH{value: depositAmount}();
        
        // Fast forward time past lock period
        vm.warp(block.timestamp + LOCK_PERIOD_1 + 1);
        
        uint256 balanceBefore = user1.balance;
        bank.withdraw(depositAmount);
        
        vm.stopPrank();
        
        assertEq(bank.getBalance(), 0);
        assertEq(user1.balance, balanceBefore + depositAmount);
    }

    function testETHEmergencyWithdrawWithPenalty() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Deposit ETH
        uint256 depositAmount = 10 ether;
        bank.depositETH{value: depositAmount}();
        
        uint256 balanceBefore = user1.balance;
        uint256 factoryBalanceBefore = address(factory).balance;
        
        // Emergency withdraw (before lock period)
        bank.emergencyWithdraw(depositAmount);
        
        vm.stopPrank();
        
        // Calculate expected amounts
        uint256 penalty = (depositAmount * 3) / 100; // 3% penalty
        uint256 expectedWithdraw = depositAmount - penalty;
        
        assertEq(bank.getBalance(), 0);
        assertEq(user1.balance, balanceBefore + expectedWithdraw);
        assertEq(address(factory).balance, factoryBalanceBefore + penalty);
    }

    function test_RevertWhen_ETHWithdrawBeforeLockPeriod() public {
        vm.startPrank(user1);

        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));

        bank.depositETH{value: 5 ether}();

        vm.expectRevert(PiggyBank.LockPeriodNotExpired.selector);
        bank.withdraw(5 ether); // Should fail - lock period not expired

        vm.stopPrank();
    }

    // ============ PiggyBank Token Tests ============

    function testTokenDeposit() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Approve and deposit tokens
        uint256 depositAmount = 1000 * 10**18;
        token.approve(piggyBank, depositAmount);
        bank.depositToken(depositAmount);
        
        vm.stopPrank();
        
        assertEq(bank.getBalance(), depositAmount);
        assertEq(token.balanceOf(piggyBank), depositAmount);
    }

    function testTokenWithdrawAfterLockPeriod() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Deposit tokens
        uint256 depositAmount = 1000 * 10**18;
        token.approve(piggyBank, depositAmount);
        bank.depositToken(depositAmount);
        
        // Fast forward time
        vm.warp(block.timestamp + LOCK_PERIOD_1 + 1);
        
        uint256 balanceBefore = token.balanceOf(user1);
        bank.withdraw(depositAmount);
        
        vm.stopPrank();
        
        assertEq(bank.getBalance(), 0);
        assertEq(token.balanceOf(user1), balanceBefore + depositAmount);
    }

    function testTokenEmergencyWithdrawWithPenalty() public {
        vm.startPrank(user1);
        
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Deposit tokens
        uint256 depositAmount = 1000 * 10**18;
        token.approve(piggyBank, depositAmount);
        bank.depositToken(depositAmount);
        
        uint256 balanceBefore = token.balanceOf(user1);
        uint256 factoryBalanceBefore = token.balanceOf(address(factory));
        
        // Emergency withdraw
        bank.emergencyWithdraw(depositAmount);
        
        vm.stopPrank();
        
        // Calculate expected amounts
        uint256 penalty = (depositAmount * 3) / 100;
        uint256 expectedWithdraw = depositAmount - penalty;
        
        assertEq(bank.getBalance(), 0);
        assertEq(token.balanceOf(user1), balanceBefore + expectedWithdraw);
        assertEq(token.balanceOf(address(factory)), factoryBalanceBefore + penalty);
    }

    // ============ Factory Query Tests ============

    function testGetUserTotalETHBalance() public {
        vm.startPrank(user1);
        
        // Create multiple ETH piggy banks
        address bank1 = factory.createETHPiggyBank(LOCK_PERIOD_1);
        address bank2 = factory.createETHPiggyBank(LOCK_PERIOD_2);
        
        // Deposit different amounts
        PiggyBank(payable(bank1)).depositETH{value: 3 ether}();
        PiggyBank(payable(bank2)).depositETH{value: 7 ether}();
        
        vm.stopPrank();
        
        uint256 totalBalance = factory.getUserTotalETHBalance(user1);
        assertEq(totalBalance, 10 ether);
    }

    function testGetUserTotalTokenBalance() public {
        vm.startPrank(user1);
        
        // Create multiple token piggy banks
        address bank1 = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        address bank2 = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_2);
        
        // Deposit different amounts
        uint256 amount1 = 500 * 10**18;
        uint256 amount2 = 1500 * 10**18;
        
        token.approve(bank1, amount1);
        PiggyBank(payable(bank1)).depositToken(amount1);
        
        token.approve(bank2, amount2);
        PiggyBank(payable(bank2)).depositToken(amount2);
        
        vm.stopPrank();
        
        uint256 totalBalance = factory.getUserTotalTokenBalance(user1, address(token));
        assertEq(totalBalance, amount1 + amount2);
    }

    function testGetUserPiggyBankDetails() public {
        vm.startPrank(user1);
        
        address ethBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        address tokenBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_2);
        
        // Make deposits
        PiggyBank(payable(ethBank)).depositETH{value: 2 ether}();
        
        token.approve(tokenBank, 1000 * 10**18);
        PiggyBank(payable(tokenBank)).depositToken(1000 * 10**18);
        
        vm.stopPrank();
        
        (
            address[] memory banks,
            address[] memory tokens,
            uint256[] memory balances,
            uint256[] memory lockPeriods,
            bool[] memory isLocked
        ) = factory.getUserPiggyBankDetails(user1);
        
        assertEq(banks.length, 2);
        assertEq(banks[0], ethBank);
        assertEq(banks[1], tokenBank);
        
        assertEq(tokens[0], address(0)); // ETH
        assertEq(tokens[1], address(token));
        
        assertEq(balances[0], 2 ether);
        assertEq(balances[1], 1000 * 10**18);
        
        assertEq(lockPeriods[0], LOCK_PERIOD_1);
        assertEq(lockPeriods[1], LOCK_PERIOD_2);
        
        assertTrue(isLocked[0]);
        assertTrue(isLocked[1]);
    }

    // ============ Admin Tests ============

    function testAdminWithdrawPenaltyETH() public {
        // Setup: Create piggy bank and trigger penalty
        vm.startPrank(user1);
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        bank.depositETH{value: 10 ether}();
        bank.emergencyWithdraw(10 ether); // Triggers 3% penalty
        vm.stopPrank();
        
        uint256 expectedPenalty = (10 ether * 3) / 100;
        assertEq(factory.getPenaltyETHBalance(), expectedPenalty);
        
        // Admin withdraws penalty
        uint256 adminBalanceBefore = admin.balance;
        factory.withdrawPenaltyETH(expectedPenalty);
        
        assertEq(admin.balance, adminBalanceBefore + expectedPenalty);
        assertEq(factory.getPenaltyETHBalance(), 0);
    }

    function testAdminWithdrawPenaltyToken() public {
        // Setup: Create token piggy bank and trigger penalty
        vm.startPrank(user1);
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        uint256 depositAmount = 1000 * 10**18;
        token.approve(piggyBank, depositAmount);
        bank.depositToken(depositAmount);
        bank.emergencyWithdraw(depositAmount);
        vm.stopPrank();
        
        uint256 expectedPenalty = (depositAmount * 3) / 100;
        assertEq(factory.getPenaltyTokenBalance(address(token)), expectedPenalty);
        
        // Admin withdraws penalty
        uint256 adminBalanceBefore = token.balanceOf(admin);
        factory.withdrawPenaltyToken(address(token), expectedPenalty);
        
        assertEq(token.balanceOf(admin), adminBalanceBefore + expectedPenalty);
        assertEq(factory.getPenaltyTokenBalance(address(token)), 0);
    }

    function test_RevertWhen_NonAdminWithdrawPenalty() public {
        vm.prank(user1);
        vm.expectRevert(PiggyBankFactory.OnlyAdmin.selector);
        factory.withdrawPenaltyETH(1 ether); // Should fail - not admin
    }

    // ============ Edge Cases and Error Tests ============

    function test_RevertWhen_DepositETHToTokenBank() public {
        vm.startPrank(user1);
        address piggyBank = factory.createTokenPiggyBank(address(token), LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));

        vm.expectRevert(PiggyBank.InvalidToken.selector);
        bank.depositETH{value: 1 ether}(); // Should fail
        vm.stopPrank();
    }

    function test_RevertWhen_DepositTokenToETHBank() public {
        vm.startPrank(user1);
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));

        token.approve(piggyBank, 1000 * 10**18);
        vm.expectRevert(PiggyBank.InvalidToken.selector);
        bank.depositToken(1000 * 10**18); // Should fail
        vm.stopPrank();
    }

    function test_RevertWhen_NonOwnerDeposit() public {
        vm.prank(user1);
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);

        vm.prank(user2); // Different user
        vm.expectRevert(PiggyBank.OnlyOwner.selector);
        PiggyBank(payable(piggyBank)).depositETH{value: 1 ether}(); // Should fail
    }

    function test_RevertWhen_WithdrawMoreThanBalance() public {
        vm.startPrank(user1);
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));

        bank.depositETH{value: 5 ether}();

        vm.warp(block.timestamp + LOCK_PERIOD_1 + 1);
        vm.expectRevert(PiggyBank.InsufficientBalance.selector);
        bank.withdraw(10 ether); // Should fail - insufficient balance
        vm.stopPrank();
    }

    function testLockPeriodChecks() public {
        vm.startPrank(user1);
        address piggyBank = factory.createETHPiggyBank(LOCK_PERIOD_1);
        PiggyBank bank = PiggyBank(payable(piggyBank));
        
        // Initially locked
        assertFalse(bank.isLockExpired());
        assertEq(bank.getRemainingLockTime(), LOCK_PERIOD_1);
        
        // Fast forward halfway
        vm.warp(block.timestamp + LOCK_PERIOD_1 / 2);
        assertFalse(bank.isLockExpired());
        assertEq(bank.getRemainingLockTime(), LOCK_PERIOD_1 / 2);
        
        // Fast forward past lock period
        vm.warp(block.timestamp + LOCK_PERIOD_1);
        assertTrue(bank.isLockExpired());
        assertEq(bank.getRemainingLockTime(), 0);
        
        vm.stopPrank();
    }
}
