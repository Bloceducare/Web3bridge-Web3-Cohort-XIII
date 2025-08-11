//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {Account} from "src/Account.sol";
import {Bank} from "src/Bank.sol";
import {Type} from "src/lib.sol";
import {TestToken} from "src/ERC20.sol";

contract BankFactoryTest is Test {
    Account public account;
    Bank public bank;
    TestToken public testToken;
    address john = makeAddr("john");
    address james = makeAddr("james");
    uint256 public lockPeriod = 5 minutes;

    function setUp() external {
        // first spin up the bank contract
        bank = new Bank();
        // deploy testtoken
        deployToken();
    }

    function deployToken()internal {
        testToken = new TestToken();
    }

    /// @notice tests for successful creation of ETH savings account
    function test_CreateEthAccount()external  {

        vm.startPrank(john);

        // create a new user and create an ether account for the new user
        address newAccount = bank.createAccount(Type.ETHER, lockPeriod, address(0));
        address newAccount2 = bank.createAccount(Type.ETHER, lockPeriod, address(0));

        vm.stopPrank();


        assertEq(bank.getUserBalance(john, newAccount), 0);
        assertEq(bank.getUserBalance(john, newAccount2), 0);
        assertEq(bank.getNumberAccounts(john), 2);

    }

    /// @notice tests for successful creation of ERC20 savings account
    function test_CreateERC20Account()external {
        vm.startPrank(john);
        address newAccount = bank.createAccount(Type.ERC20, lockPeriod, address(testToken));
        vm.stopPrank();

        assertEq(bank.getNumberAccounts(john), 1);
        assertEq(bank.getUserBalance(john, newAccount), 0);
    }

    /// @notice tests if AccountCreated event is emitted on successful creations for both ETH and ERC20 accounts
    function test_Emits_AccountCreated_On_Successful_Account_Creation()external {

        // test if AccountCreated event is emitted when an ERC20 savings account is created
        vm.prank(john);
        vm.expectEmit(true, false, false, false);
        emit Bank.AccountCreated(john, lockPeriod, Type.ERC20);

        bank.createAccount(Type.ERC20, lockPeriod, address(testToken));

        // test if AccountCreated event is emitted when an ETH savings account is created
        vm.prank(james);
        vm.expectEmit(true, false, false, false);
        emit Bank.AccountCreated(james, lockPeriod, Type.ETHER);

        bank.createAccount(Type.ETHER, lockPeriod, address(testToken));
    }

    /// @notice tests if it reverts when a non admin try to get a user's balance
    function test_Reverts_When_getUserBalanceIsCalledByNonAdmin()external {
        vm.startPrank(john);

        // create a new user and create an ether account for the new user
        address newAccount = bank.createAccount(Type.ETHER, lockPeriod, address(0));

        vm.stopPrank();

        vm.expectRevert(Bank.Bank__UnAuthorized.selector);
        vm.prank(james);
        bank.getUserBalance(john, newAccount);
    }

    /// @notice tests if it reverts when a non admin tries to get a count of all user's accounts
    function test_Reverts_When_getNumberAccountsIsCalledByNonAdmin()external {
        vm.startPrank(john);

        // create a new user and create an ether account for the new user
        bank.createAccount(Type.ETHER, lockPeriod, address(0));

        vm.stopPrank();

        vm.expectRevert(Bank.Bank__UnAuthorized.selector);
        vm.prank(james);
        bank.getNumberAccounts(john);
    }

}
