// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PiggyFactory} from "../src/piggyFactory.sol";
import {PiggyBank} from "../src/piggy.sol";
import "../src/interface/IERC20.sol";

contract TestPiggyBank is Test {
    PiggyFactory public piggyFactory;

    function setUp() public {
        piggyFactory = new PiggyFactory();
    }

    function test_CreatePiggy() public {
        address user = address(1);
        vm.startPrank(user);
        uint256 duration = 60;
        uint length = 5;
        for (uint i; i < length; i++) {
            piggyFactory.createAccount(duration);
        }

        assertEq(piggyFactory.getUserAccounts(user).length, length);
        vm.stopPrank();
    }

    function test_getUserAccounts() public {
        address user = address(1);
        vm.startPrank(user);
        uint256 duration = 60;
        assertEq(piggyFactory.getUserAccounts(user).length, 0);
        piggyFactory.createAccount(duration);
        assertEq(piggyFactory.getUserAccounts(user).length, 1);
        vm.stopPrank();
    }

    function test_getEtherBalance() public {
        address user = address(1);
        vm.startPrank(user);
        vm.deal(user, 100 ether);
        uint256 duration = 60;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        assertEq(piggyBank.getEtherBalance(), 0);
        piggyBank.deposit{value: 10}(address(0), 0);
        assertEq(piggyBank.getEtherBalance(), 10);
        vm.stopPrank();
    }

    function test_withdrawEther() public {
        address user = address(1);
        uint amountToWithdraw = 5;
        vm.startPrank(user);
        vm.deal(user, 100 ether);
        uint256 duration = 60;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        piggyBank.deposit{value: 10}(address(0), 0);
        uint initialBalance = piggyBank.getEtherBalance();
        vm.warp(block.timestamp + duration);
        piggyBank.withdraw(address(0), amountToWithdraw);
        assertEq(initialBalance - piggyBank.getEtherBalance(), amountToWithdraw);
        vm.stopPrank();
    }

    function test_depositERC20() public {
        address user = 0xD1c3a8E47d6d8Ecd5915438757f1AeebbC6faf56;
        address USDC_CA = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        uint amountToDeposit= 5000;
        vm.startPrank(user);
        uint256 duration = 60;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        uint256 initialContractBalance = IERC20Metadata(USDC_CA).balanceOf(childAccount);
        IERC20Metadata(USDC_CA).approve(childAccount, amountToDeposit);
        piggyBank.deposit(USDC_CA, amountToDeposit);
        assertEq(IERC20Metadata(USDC_CA).balanceOf(childAccount) - initialContractBalance, amountToDeposit);
        vm.stopPrank();
    }

    function test_withdrawERC20() public {
        address user = 0xD1c3a8E47d6d8Ecd5915438757f1AeebbC6faf56;
        address USDC_CA = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        uint256 amountToWithdraw = 60000;

        vm.startPrank(user);
        
        uint256 duration = 60000;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        IERC20Metadata(USDC_CA).approve(childAccount, amountToWithdraw);
        piggyBank.deposit(USDC_CA, amountToWithdraw);
        uint256 initialBalance = IERC20Metadata(USDC_CA).balanceOf(user);
        vm.warp(block.timestamp + duration);
        piggyBank.withdraw(USDC_CA, amountToWithdraw);
        assertEq(
            IERC20Metadata(USDC_CA).balanceOf(user) - initialBalance,
            amountToWithdraw
        );
        vm.stopPrank();
    }

    function test_unlock() public {
        address user = 0xD1c3a8E47d6d8Ecd5915438757f1AeebbC6faf56;
        address USDC_CA = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        uint256 amountToWithdraw = 6000;

        vm.startPrank(user);
        
        uint256 duration = 6000;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        IERC20Metadata(USDC_CA).approve(childAccount, amountToWithdraw);
        piggyBank.deposit(USDC_CA, amountToWithdraw);
        uint256 initialBalance = IERC20Metadata(USDC_CA).balanceOf(user);
        vm.warp(block.timestamp + duration - 10);
        // console.log(IERC20Metadata(USDC_CA).balanceOf(childAccount));
        piggyBank.unlock(USDC_CA);
        // console.log(IERC20Metadata(USDC_CA).balanceOf(childAccount));
        piggyBank.withdraw(USDC_CA, amountToWithdraw - (amountToWithdraw * 3 / 100));
        assertEq(
            IERC20Metadata(USDC_CA).balanceOf(user) - initialBalance,
            amountToWithdraw - (amountToWithdraw * 3 / 100)
        );
        vm.stopPrank();
    }

    function test_withdrawBeforeUnlockTime() public {
        address user = 0xD1c3a8E47d6d8Ecd5915438757f1AeebbC6faf56;
        address USDC_CA = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        uint256 amountToWithdraw = 6000;

        vm.startPrank(user);
        
        uint256 duration = 6000;
        piggyFactory.createAccount(duration);
        address payable childAccount = payable(
            piggyFactory.getUserAccounts(user)[0]
        );
        PiggyBank piggyBank = PiggyBank(childAccount);
        IERC20Metadata(USDC_CA).approve(childAccount, amountToWithdraw);
        piggyBank.deposit(USDC_CA, amountToWithdraw);
        uint256 initialBalance = IERC20Metadata(USDC_CA).balanceOf(user);
        vm.warp(block.timestamp + duration - 10);
        vm.expectRevert();
        // console.log(IERC20Metadata(USDC_CA).balanceOf(childAccount));
        // console.log(IERC20Metadata(USDC_CA).balanceOf(childAccount));
        piggyBank.withdraw(USDC_CA, amountToWithdraw - (amountToWithdraw * 3 / 100));
      
        vm.stopPrank();
    }
}
