// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";
import "../src/interfaces/IERC20.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    
    function mint(address _to, uint256 _amount) external {
        _balances[_to] += _amount;
        _totalSupply += _amount;
        emit Transfer(address(0), _to, _amount);
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address _account) external view override returns (uint256) {
        return _balances[_account];
    }
    
    function transfer(address _to, uint256 _amount) external override returns (bool) {
        if (_balances[msg.sender] < _amount) return false;
        _balances[msg.sender] -= _amount;
        _balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }
    
    function allowance(address _owner, address _spender) external view override returns (uint256) {
        return _allowances[_owner][_spender];
    }
    
    function approve(address _spender, uint256 _amount) external override returns (bool) {
        _allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _amount) external override returns (bool) {
        if (_balances[_from] < _amount || _allowances[_from][msg.sender] < _amount) return false;
        _balances[_from] -= _amount;
        _balances[_to] += _amount;
        _allowances[_from][msg.sender] -= _amount;
        emit Transfer(_from, _to, _amount);
        return true;
    }
}

contract PiggyBankFactoryTest is Test {
    PiggyBankFactory public factory;
    MockERC20 public mockToken;
    
    address public admin = address(this);
    address public user = address(0x123);
    address public user2 = address(0x456);
    
    uint64 public constant LOCK_PERIOD = 1 days;
    uint256 public constant DEPOSIT_AMOUNT = 1 ether;
    
    event AccountCreated(address indexed owner, address indexed account, address tokenAddress, uint64 lockPeriod);
    event Deposited(address indexed owner, uint256 amount, bool isERC20);
    event Withdrawn(address indexed owner, uint256 amount, bool isERC20);
    event BreakingFeePaid(address indexed owner, uint256 amount);
    
    function setUp() public {
        factory = new PiggyBankFactory();
        mockToken = new MockERC20();
        mockToken.mint(user, 1000 ether);
        
        vm.deal(user, 10 ether);
        vm.deal(user2, 5 ether);
    }
    
    receive() external payable {}
    
    function test_DeployFactory() public view {
        assertEq(factory.admin(), admin);
    }
    
    function test_CreateEtherPiggyBank() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        assertTrue(account != address(0));
        
        PiggyBank piggyBank = PiggyBank(account);
        assertEq(piggyBank.owner(), user);
        assertEq(piggyBank.tokenAddress(), address(0));
        assertEq(piggyBank.lockPeriod(), LOCK_PERIOD);
        assertEq(piggyBank.admin(), admin);
        
        assertEq(factory.getUserAccountCount(user), 1);
        assertEq(factory.getUserAccounts(user)[0], account);
        
        vm.stopPrank();
    }
    
    function test_CreateERC20PiggyBank() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        assertTrue(account != address(0));
        
        PiggyBank piggyBank = PiggyBank(account);
        assertEq(piggyBank.owner(), user);
        assertEq(piggyBank.tokenAddress(), address(mockToken));
        assertEq(piggyBank.lockPeriod(), LOCK_PERIOD);
        
        vm.stopPrank();
    }
    
    function test_DepositEther() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        assertEq(piggyBank.getBalance(), DEPOSIT_AMOUNT);
        assertEq(factory.getTotalUserBalance(user), DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_DepositERC20() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        mockToken.approve(address(piggyBank), DEPOSIT_AMOUNT);
        piggyBank.depositERC20(DEPOSIT_AMOUNT);
        
        assertEq(piggyBank.getBalance(), DEPOSIT_AMOUNT);
        assertEq(mockToken.balanceOf(address(piggyBank)), DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_WithdrawEtherAfterLock() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        uint256 initialBalance = user.balance;
        
        vm.warp(block.timestamp + LOCK_PERIOD + 1);
        
        piggyBank.withdraw();
        assertEq(piggyBank.getBalance(), 0);
        assertEq(user.balance, initialBalance + DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_WithdrawERC20AfterLock() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        mockToken.approve(address(piggyBank), DEPOSIT_AMOUNT);
        piggyBank.depositERC20(DEPOSIT_AMOUNT);
        
        uint256 initialBalance = mockToken.balanceOf(user);
        
        vm.warp(block.timestamp + LOCK_PERIOD + 1);
        
        piggyBank.withdraw();
        assertEq(piggyBank.getBalance(), 0);
        assertEq(mockToken.balanceOf(user), initialBalance + DEPOSIT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function test_EarlyWithdrawalFee() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        uint256 initialUserBalance = user.balance;
        uint256 initialAdminBalance = admin.balance;
        
        piggyBank.withdraw();
        
        uint256 fee = (DEPOSIT_AMOUNT * 3) / 100;
        uint256 userAmount = DEPOSIT_AMOUNT - fee;
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(user.balance, initialUserBalance + userAmount);
        assertEq(admin.balance, initialAdminBalance + fee);
        
        vm.stopPrank();
    }
    
    function test_EarlyERC20WithdrawalFee() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        mockToken.approve(address(piggyBank), DEPOSIT_AMOUNT);
        piggyBank.depositERC20(DEPOSIT_AMOUNT);
        
        uint256 initialUserBalance = mockToken.balanceOf(user);
        uint256 initialAdminBalance = mockToken.balanceOf(admin);
        
        piggyBank.withdraw();
        
        uint256 fee = (DEPOSIT_AMOUNT * 3) / 100;
        uint256 userAmount = DEPOSIT_AMOUNT - fee;
        assertEq(piggyBank.getBalance(), 0);
        assertEq(mockToken.balanceOf(user), initialUserBalance + userAmount);
        assertEq(mockToken.balanceOf(admin), initialAdminBalance + fee);
        
        vm.stopPrank();
    }
    
    function test_LockPeriodMechanics() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        uint64 startTime = piggyBank.startTime();
        uint64 lockExpiry = piggyBank.getLockExpiry();
        bool isLockExpired = piggyBank.isLockExpired();
        
        assertEq(startTime, 1);
        assertEq(lockExpiry, startTime + LOCK_PERIOD);
        assertEq(isLockExpired, false);
        
        vm.stopPrank();
    }
    
    function test_LockPeriodExpiry() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        uint64 startTime = piggyBank.startTime();
        uint64 lockExpiry = piggyBank.getLockExpiry();
        
        assertEq(lockExpiry, startTime + LOCK_PERIOD);
        
        vm.warp(lockExpiry - 1);
        assertEq(piggyBank.isLockExpired(), false);
        
        vm.warp(lockExpiry);
        assertEq(piggyBank.isLockExpired(), true);
        
        vm.warp(lockExpiry + 1);
        assertEq(piggyBank.isLockExpired(), true);
        
        vm.stopPrank();
    }
    
    function test_EarlyWithdrawalExactFeeCalculation() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        uint256 depositAmount = 5 ether;
        piggyBank.deposit{value: depositAmount}();
        
        uint256 initialUserBalance = user.balance;
        uint256 initialAdminBalance = admin.balance;
        
        piggyBank.withdraw();
        
        uint256 expectedFee = (depositAmount * 3) / 100;
        uint256 expectedUserAmount = depositAmount - expectedFee;
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(user.balance, initialUserBalance + expectedUserAmount);
        assertEq(admin.balance, initialAdminBalance + expectedFee);
        assertEq(expectedFee, 0.15 ether);
        assertEq(expectedUserAmount, 4.85 ether);
        
        vm.stopPrank();
    }
    
    function test_ERC20EarlyWithdrawalExactFeeCalculation() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        uint256 depositAmount = 100 ether;
        mockToken.approve(address(piggyBank), depositAmount);
        piggyBank.depositERC20(depositAmount);
        
        uint256 initialUserBalance = mockToken.balanceOf(user);
        uint256 initialAdminBalance = mockToken.balanceOf(admin);
        
        piggyBank.withdraw();
        
        uint256 expectedFee = (depositAmount * 3) / 100;
        uint256 expectedUserAmount = depositAmount - expectedFee;
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(mockToken.balanceOf(user), initialUserBalance + expectedUserAmount);
        assertEq(mockToken.balanceOf(admin), initialAdminBalance + expectedFee);
        assertEq(expectedFee, 3 ether);
        assertEq(expectedUserAmount, 97 ether);
        
        vm.stopPrank();
    }
    
    function test_NoFeeAfterLockExpiry() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        uint256 initialUserBalance = user.balance;
        uint256 initialAdminBalance = admin.balance;
        
        vm.warp(block.timestamp + LOCK_PERIOD + 1);
        
        piggyBank.withdraw();
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(user.balance, initialUserBalance + DEPOSIT_AMOUNT);
        assertEq(admin.balance, initialAdminBalance);
        
        vm.stopPrank();
    }
    
    function test_ERC20NoFeeAfterLockExpiry() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(mockToken), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        mockToken.approve(address(piggyBank), DEPOSIT_AMOUNT);
        piggyBank.depositERC20(DEPOSIT_AMOUNT);
        
        uint256 initialUserBalance = mockToken.balanceOf(user);
        uint256 initialAdminBalance = mockToken.balanceOf(admin);
        
        vm.warp(block.timestamp + LOCK_PERIOD + 1);
        
        piggyBank.withdraw();
        
        assertEq(piggyBank.getBalance(), 0);
        assertEq(mockToken.balanceOf(user), initialUserBalance + DEPOSIT_AMOUNT);
        assertEq(mockToken.balanceOf(admin), initialAdminBalance);
        
        vm.stopPrank();
    }
    
    function test_MultipleAccounts() public {
        vm.startPrank(user);
        
        address account1 = factory.createPiggyBank(address(0), LOCK_PERIOD);
        address account2 = factory.createPiggyBank(address(mockToken), LOCK_PERIOD * 2);
        
        assertEq(factory.getUserAccountCount(user), 2);
        
        address[] memory accounts = factory.getUserAccounts(user);
        assertEq(accounts[0], account1);
        assertEq(accounts[1], account2);
        
        vm.stopPrank();
    }
    
    function test_AccountInfo() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        piggyBank.deposit{value: DEPOSIT_AMOUNT}();
        
        (
            address owner,
            address tokenAddress,
            uint256 balance,
            uint64 lockPeriod,
            uint64 startTime,
            uint64 lockExpiry,
            bool isLockExpired
        ) = factory.getAccountInfo(account);
        
        assertEq(owner, user);
        assertEq(tokenAddress, address(0));
        assertEq(balance, DEPOSIT_AMOUNT);
        assertEq(lockPeriod, LOCK_PERIOD);
        assertEq(lockExpiry, startTime + LOCK_PERIOD);
        assertEq(isLockExpired, false);
        
        vm.stopPrank();
    }
    
    function test_CompleteWorkflowAllRequirements() public {
        vm.startPrank(user);
        
        console.log("=== Testing Complete Workflow - All Core Requirements ===");
        
        // 1. Factory Pattern - Create multiple savings accounts
        console.log("1. Creating multiple savings accounts...");
        address payable etherAccount = payable(factory.createPiggyBank(address(0), 1 days));
        address payable tokenAccount = payable(factory.createPiggyBank(address(mockToken), 7 days));
        address payable longTermAccount = payable(factory.createPiggyBank(address(0), 30 days));
        
        assertEq(factory.getUserAccountCount(user), 3);
        console.log("   [OK] Created 3 savings accounts");
        
        // 2. Savings Options - Test both ETH and ERC20
        console.log("2. Testing ETH and ERC20 deposits...");
        
        // ETH deposit
        PiggyBank etherPiggyBank = PiggyBank(etherAccount);
        etherPiggyBank.deposit{value: 2 ether}();
        assertEq(etherPiggyBank.getBalance(), 2 ether);
        console.log("   [OK] ETH deposit successful: 2 ETH");
        
        // ERC20 deposit
        PiggyBank tokenPiggyBank = PiggyBank(tokenAccount);
        mockToken.approve(address(tokenPiggyBank), 500 ether);
        tokenPiggyBank.depositERC20(500 ether);
        assertEq(tokenPiggyBank.getBalance(), 500 ether);
        console.log("   [OK] ERC20 deposit successful: 500 tokens");
        
        // 3. Admin Role & Fee Collection
        console.log("3. Testing admin fee collection...");
        uint256 initialAdminBalance = admin.balance;
        
        // Early withdrawal with fee
        etherPiggyBank.withdraw();
        uint256 fee = (2 ether * 3) / 100;
        assertEq(admin.balance, initialAdminBalance + fee);
        console.log("   [OK] Admin received 3% fee:", fee, "wei");
        
        // 4. Balance Tracking
        console.log("4. Testing balance tracking...");
        assertEq(factory.getTotalUserBalance(user), 500 ether);
        console.log("   [OK] Factory tracks total user balance correctly");
        
        // 5. Savings Account Tracking
        console.log("5. Testing account tracking...");
        address[] memory accounts = factory.getUserAccounts(user);
        assertEq(accounts.length, 3);
        assertEq(accounts[0], etherAccount);
        assertEq(accounts[1], tokenAccount);
        assertEq(accounts[2], longTermAccount);
        console.log("   [OK] Factory tracks all user accounts");
        
        // 6. Lock Period Mechanics
        console.log("6. Testing lock period mechanics...");
        
        // Test lock expiry
        vm.warp(block.timestamp + 7 days + 1);
        assertEq(tokenPiggyBank.isLockExpired(), true);
        console.log("   [OK] 7-day lock period expired");
        
        // Withdraw without fee after lock expiry
        uint256 initialUserTokenBalance = mockToken.balanceOf(user);
        uint256 adminBalanceBefore = mockToken.balanceOf(admin);
        tokenPiggyBank.withdraw();
        assertEq(mockToken.balanceOf(user), initialUserTokenBalance + 500 ether);
        assertEq(mockToken.balanceOf(admin), adminBalanceBefore);
        console.log("   [OK] No fee charged after lock expiry");
        
        vm.stopPrank();
        console.log("=== All Core Requirements Tested Successfully ===");
    }
    
    function test_RevertInvalidLockPeriod() public {
        vm.startPrank(user);
        
        vm.expectRevert(PiggyBankFactory__InvalidLockPeriod.selector);
        factory.createPiggyBank(address(0), 0);
        
        vm.stopPrank();
    }
    
    function test_RevertNotOwner() public {
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        vm.prank(user2);
        vm.expectRevert(PiggyBank__NotOwner.selector);
        piggyBank.deposit{value: 1 ether}();
    }
    
    function test_RevertZeroAmount() public {
        vm.startPrank(user);
        
        address payable account = payable(factory.createPiggyBank(address(0), LOCK_PERIOD));
        PiggyBank piggyBank = PiggyBank(account);
        
        vm.expectRevert(PiggyBank__ZeroAmount.selector);
        piggyBank.deposit{value: 0}();
        
        vm.expectRevert(PiggyBank__ZeroAmount.selector);
        piggyBank.depositERC20(0);
        
        vm.stopPrank();
    }
} 