// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PiggyBankFactoryTest is Test {
    PiggyBankFactory factory;
    MockERC20 token;
    
    address user1 = address(0x1);
    address user2 = address(0x2);
    address user3 = address(0x3);
    address factoryOwner = address(0x999);
    
    // Events to test
    event PiggyBankCreated(address indexed user, address indexed piggyBank, uint256 index);
    event SavingsAccountCreated(uint256 indexed accountId, uint256 lockPeriod, address token);
    event Deposited(uint256 indexed accountId, uint256 amount, address token);
    event Withdrawn(uint256 indexed accountId, uint256 amount, uint256 penalty, address token);
    event PenaltyCollected(address indexed user, uint256 amount, address token);
    
    function setUp() public {
        // Deploy factory with factoryOwner as the owner
        vm.prank(factoryOwner);
        factory = new PiggyBankFactory();
        
        // Deploy mock token
        token = new MockERC20("Test Token", "TEST");
        
        // Give users ETH and tokens
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        
        token.mint(user1, 10000 * 10**18);
        token.mint(user2, 10000 * 10**18);
        token.mint(user3, 10000 * 10**18);
    }
    
    // ==================== FACTORY TESTS ====================
    
    function testFactoryDeployment() public {
        assertEq(factory.owner(), factoryOwner);
        assertEq(factory.getAllPiggyBanks().length, 0);
        
        (uint256 totalBanks, uint256 ethBalance, address owner) = factory.getFactoryStats();
        assertEq(totalBanks, 0);
        assertEq(ethBalance, 0);
        assertEq(owner, factoryOwner);
    }
    
    function testCreateSinglePiggyBank() public {
        vm.expectEmit(true, true, false, true);
        emit PiggyBankCreated(user1, address(0), 0); // We don't know the exact address
        
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        
        assertTrue(piggyBankAddress != address(0));
        assertEq(factory.getUserPiggyBankCount(user1), 1);
        
        address[] memory userBanks = factory.getUserPiggyBanks(user1);
        assertEq(userBanks.length, 1);
        assertEq(userBanks[0], piggyBankAddress);
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        assertEq(piggyBank.owner(), user1);
        assertEq(piggyBank.factory(), address(factory));
    }
    
    function testCreateMultiplePiggyBanks() public {
        vm.startPrank(user1);
        
        address bank1 = factory.createPiggyBank();
        address bank2 = factory.createPiggyBank();
        address bank3 = factory.createPiggyBank();
        
        vm.stopPrank();
        
        assertEq(factory.getUserPiggyBankCount(user1), 3);
        assertTrue(bank1 != bank2);
        assertTrue(bank2 != bank3);
        assertTrue(bank1 != bank3);
        
        address[] memory userBanks = factory.getUserPiggyBanks(user1);
        assertEq(userBanks.length, 3);
        assertEq(userBanks[0], bank1);
        assertEq(userBanks[1], bank2);
        assertEq(userBanks[2], bank3);
        
        // Check global stats
        assertEq(factory.getAllPiggyBanks().length, 3);
    }
    
    function testMultipleUsersCreatePiggyBanks() public {
        vm.prank(user1);
        address bank1 = factory.createPiggyBank();
        
        vm.prank(user2);
        address bank2 = factory.createPiggyBank();
        
        vm.prank(user1);
        address bank3 = factory.createPiggyBank();
        
        assertEq(factory.getUserPiggyBankCount(user1), 2);
        assertEq(factory.getUserPiggyBankCount(user2), 1);
        assertEq(factory.getUserPiggyBankCount(user3), 0);
        
        assertEq(factory.getAllPiggyBanks().length, 3);
    }
    
    // ==================== PIGGY BANK TESTS ====================
    
    function testCreateSavingsAccountETH() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.expectEmit(true, false, false, true);
        emit SavingsAccountCreated(0, 30 days, address(0));
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        assertEq(accountId, 0);
        assertEq(piggyBank.getTotalAccounts(), 1);
        
        (uint256 balance, uint256 lockPeriod, uint256 startTime, address tokenAddr, bool isActive, bool isLocked) = 
            piggyBank.getSavingsAccount(accountId);
        
        assertEq(balance, 0);
        assertEq(lockPeriod, 30 days);
        assertEq(startTime, block.timestamp);
        assertEq(tokenAddr, address(0));
        assertTrue(isActive);
        assertTrue(isLocked);
    }
    
    function testCreateSavingsAccountToken() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(90 days, address(token));
        
        (uint256 balance, uint256 lockPeriod, uint256 startTime, address tokenAddr, bool isActive, bool isLocked) = 
            piggyBank.getSavingsAccount(accountId);
        
        assertEq(balance, 0);
        assertEq(lockPeriod, 90 days);
        assertEq(tokenAddr, address(token));
        assertTrue(isActive);
        assertTrue(isLocked);
    }
    
    function testCreateMultipleSavingsAccountsWithDifferentLockPeriods() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.startPrank(user1);
        uint256 account1 = piggyBank.createSavingsAccount(1 days, address(0));
        uint256 account2 = piggyBank.createSavingsAccount(30 days, address(0));
        uint256 account3 = piggyBank.createSavingsAccount(90 days, address(token));
        uint256 account4 = piggyBank.createSavingsAccount(365 days, address(token));
        vm.stopPrank();
        
        assertEq(piggyBank.getTotalAccounts(), 4);
        
        (, uint256 lock1, , , ,) = piggyBank.getSavingsAccount(account1);
        (, uint256 lock2, , , ,) = piggyBank.getSavingsAccount(account2);
        (, uint256 lock3, , , ,) = piggyBank.getSavingsAccount(account3);
        (, uint256 lock4, , , ,) = piggyBank.getSavingsAccount(account4);
        
        assertEq(lock1, 1 days);
        assertEq(lock2, 30 days);
        assertEq(lock3, 90 days);
        assertEq(lock4, 365 days);
    }
    
    function testCannotCreateSavingsAccountWithZeroLockPeriod() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        vm.expectRevert("Lock period must be greater than 0");
        piggyBank.createSavingsAccount(0, address(0));
    }
    
    function testOnlyOwnerCanCreateSavingsAccount() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user2); // Different user
        vm.expectRevert("Not the owner");
        piggyBank.createSavingsAccount(30 days, address(0));
    }
    
    // ==================== DEPOSIT TESTS ====================
    
    function testDepositETH() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.expectEmit(true, false, false, true);
        emit Deposited(accountId, 5 ether, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 5 ether}(accountId);
        
        (uint256 balance, , , , ,) = piggyBank.getSavingsAccount(accountId);
        assertEq(balance, 5 ether);
        assertEq(piggyBank.getTotalBalance(address(0)), 5 ether);
        assertEq(factory.getUserTotalBalance(user1, address(0)), 5 ether);
    }
    
    function testMultipleETHDeposits() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.startPrank(user1);
        piggyBank.depositETH{value: 1 ether}(accountId);
        piggyBank.depositETH{value: 2 ether}(accountId);
        piggyBank.depositETH{value: 3 ether}(accountId);
        vm.stopPrank();
        
        (uint256 balance, , , , ,) = piggyBank.getSavingsAccount(accountId);
        assertEq(balance, 6 ether);
    }
    
    function testDepositToken() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(token));
        
        uint256 depositAmount = 1000 * 10**18;
        
        vm.startPrank(user1);
        token.approve(address(piggyBank), depositAmount);
        
        vm.expectEmit(true, false, false, true);
        emit Deposited(accountId, depositAmount, address(token));
        
        piggyBank.depositToken(accountId, depositAmount);
        vm.stopPrank();
        
        (uint256 balance, , , , ,) = piggyBank.getSavingsAccount(accountId);
        assertEq(balance, depositAmount);
        assertEq(piggyBank.getTotalBalance(address(token)), depositAmount);
        assertEq(factory.getUserTotalBalance(user1, address(token)), depositAmount);
    }
    
    function testCannotDepositETHToTokenAccount() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(token));
        
        vm.prank(user1);
        vm.expectRevert("This account is for tokens only");
        piggyBank.depositETH{value: 1 ether}(accountId);
    }
    
    function testCannotDepositTokenToETHAccount() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.startPrank(user1);
        token.approve(address(piggyBank), 1000 * 10**18);
        vm.expectRevert("This account is for ETH only");
        piggyBank.depositToken(accountId, 1000 * 10**18);
        vm.stopPrank();
    }
    
    function testCannotDepositZeroETH() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        vm.expectRevert("Must send some ETH");
        piggyBank.depositETH{value: 0}(accountId);
    }
    
    function testCannotDepositZeroTokens() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(token));
        
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        piggyBank.depositToken(accountId, 0);
    }
    
    // ==================== WITHDRAWAL TESTS ====================
    
    function testEarlyWithdrawalETHWithPenalty() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 10 ether}(accountId);
        
        uint256 userBalanceBefore = user1.balance;
        uint256 factoryBalanceBefore = address(factory).balance;
        
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(accountId, 9.7 ether, 0.3 ether, address(0));
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, 10 ether);
        
        // User receives 97% (3% penalty)
        assertEq(user1.balance, userBalanceBefore + 9.7 ether);
        // Factory receives 3% penalty
        assertEq(address(factory).balance, factoryBalanceBefore + 0.3 ether);
        
        // Account balance should be 0
        (uint256 balance, , , , ,) = piggyBank.getSavingsAccount(accountId);
        assertEq(balance, 0);
    }
    
    function testEarlyWithdrawalTokenWithPenalty() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(token));
        
        uint256 depositAmount = 1000 * 10**18;
        vm.startPrank(user1);
        token.approve(address(piggyBank), depositAmount);
        piggyBank.depositToken(accountId, depositAmount);
        vm.stopPrank();
        
        uint256 userTokenBalanceBefore = token.balanceOf(user1);
        uint256 factoryTokenBalanceBefore = token.balanceOf(address(factory));
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, depositAmount);
        
        // User receives 97% (3% penalty)
        uint256 expectedUserAmount = (depositAmount * 97) / 100;
        uint256 expectedPenalty = (depositAmount * 3) / 100;
        
        assertEq(token.balanceOf(user1), userTokenBalanceBefore + expectedUserAmount);
        assertEq(token.balanceOf(address(factory)), factoryTokenBalanceBefore + expectedPenalty);
    }
    
    function testWithdrawalAfterLockPeriodNoPenalty() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(1 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 5 ether}(accountId);
        
        // Fast forward past lock period
        vm.warp(block.timestamp + 1 days + 1);
        
        uint256 userBalanceBefore = user1.balance;
        uint256 factoryBalanceBefore = address(factory).balance;
        
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(accountId, 5 ether, 0, address(0));
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, 5 ether);
        
        // User receives full amount (no penalty)
        assertEq(user1.balance, userBalanceBefore + 5 ether);
        // No penalty to factory
        assertEq(address(factory).balance, factoryBalanceBefore);
    }
    
    function testPartialWithdrawal() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 10 ether}(accountId);
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, 3 ether); // Partial withdrawal
        
        // Check remaining balance
        (uint256 balance, , , , ,) = piggyBank.getSavingsAccount(accountId);
        assertEq(balance, 7 ether);
    }
    
    function testCannotWithdrawMoreThanBalance() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 5 ether}(accountId);
        
        vm.prank(user1);
        vm.expectRevert("Insufficient balance");
        piggyBank.withdraw(accountId, 10 ether);
    }
    
    function testOnlyOwnerCanWithdraw() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 5 ether}(accountId);
        
        vm.prank(user2); // Different user
        vm.expectRevert("Not the owner");
        piggyBank.withdraw(accountId, 1 ether);
    }
    
    // ==================== PENALTY SYSTEM TESTS ====================
    
    function testFactoryOwnerCanWithdrawETHPenalties() public {
        // Setup penalty collection
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 10 ether}(accountId);
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, 10 ether); // Creates 0.3 ETH penalty
        
        assertEq(address(factory).balance, 0.3 ether);
        
        // Factory owner withdraws penalties
        uint256 ownerBalanceBefore = factoryOwner.balance;
        
        vm.prank(factoryOwner);
        factory.withdrawETHPenalties();
        
        assertEq(factoryOwner.balance, ownerBalanceBefore + 0.3 ether);
        assertEq(address(factory).balance, 0);
    }
    
    function testFactoryOwnerCanWithdrawTokenPenalties() public {
        // Setup penalty collection
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(token));
        
        uint256 depositAmount = 1000 * 10**18;
        vm.startPrank(user1);
        token.approve(address(piggyBank), depositAmount);
        piggyBank.depositToken(accountId, depositAmount);
        piggyBank.withdraw(accountId, depositAmount); // Creates penalty
        vm.stopPrank();
        
        uint256 expectedPenalty = (depositAmount * 3) / 100;
        assertEq(token.balanceOf(address(factory)), expectedPenalty);
        
        // Factory owner withdraws token penalties
        uint256 ownerTokenBalanceBefore = token.balanceOf(factoryOwner);
        
        vm.prank(factoryOwner);
        factory.withdrawTokenPenalties(address(token));
        
        assertEq(token.balanceOf(factoryOwner), ownerTokenBalanceBefore + expectedPenalty);
        assertEq(token.balanceOf(address(factory)), 0);
    }
    
    function testNonOwnerCannotWithdrawPenalties() public {
        // Setup some penalty
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.prank(user1);
        uint256 accountId = piggyBank.createSavingsAccount(30 days, address(0));
        
        vm.prank(user1);
        piggyBank.depositETH{value: 10 ether}(accountId);
        
        vm.prank(user1);
        piggyBank.withdraw(accountId, 10 ether);
        
        // Non-owner tries to withdraw penalties
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        factory.withdrawETHPenalties();
        
        vm.prank(user2);
        vm.expectRevert("Ownable: caller is not the owner");
        factory.withdrawTokenPenalties(address(token));
    }
    
    // ==================== VIEW FUNCTION TESTS ====================
    
    function testGetAllSavingsAccounts() public {
        vm.prank(user1);
        address piggyBankAddress = factory.createPiggyBank();
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        
        vm.startPrank(user1);
        piggyBank.createSavingsAccount(1 days, address(0));
        piggyBank.createSavingsAccount(30 days, address(token));
        piggyBank.createSavingsAccount(90 days, address(0));
        vm.stopPrank();
        
        (
            uint256[] memory accountIds,
            uint256[] memory balances,
            uint256[] memory lockPeriods,
            uint256[] memory startTimes,
            address[] memory tokens,
            bool[] memory isLocked
        ) = piggyBank.getAllSavingsAccounts();
        
        assertEq(accountIds.length, 3);
        assertEq(lockPeriods[0], 1 days);
        assertEq(lockPeriods[1], 30 days);
        assertEq(lockPeriods[2], 90 days);
        assertEq(tokens[0], address(0));
        assertEq(tokens[1], address(token));
        assertEq(tokens[2], address(0));
        assertTrue(isLocked[0]);
        assertTrue(isLocked[1]);
        assertTrue(isLocked[2]);
    }
    
    function testGetUserData() public {
        vm.startPrank(user1);
        address bank1 = factory.createPiggyBank();
        address bank2 = factory.createPiggyBank();
        
        PiggyBank(bank1).createSavingsAccount(30 days, address(0));
        PiggyBank(bank2).createSavingsAccount(90 days, address(0));
        PiggyBank(bank2).createSavingsAccount(180 days, address(token));
        
        PiggyBank(bank1).depositETH{value: 5 ether}(0);
        PiggyBank(bank2).depositETH{value: 3 ether}(0);
        vm.stopPrank();
        
        (
            address[] memory piggyBanks,
            uint256 totalSavingsAccounts,
            uint256 totalETHBalance,
            uint256 factoryPenaltyETH
        ) = factory.getUserData(user1);
        
        assertEq(piggyBanks.length, 2);
        assertEq(totalSavingsAccounts, 3);
        assertEq(totalETHBalance, 8 ether);
        assertEq(factoryPenaltyETH, 0);
    }
    
    function testGetFactoryStats() public {
        vm.prank(user1);
        factory.createPiggyBank();
        
        vm.prank(user2);
        factory.createPiggyBank();
        
        (uint256 totalBanks, uint256 ethBalance, address owner) = factory.getFactoryStats();
        
        assertEq(totalBanks, 2);
        assertEq(ethBalance, 0);
        assertEq(owner, factoryOwner);
    }
}