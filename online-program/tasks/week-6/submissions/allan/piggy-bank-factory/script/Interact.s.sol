// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";
import "../src/MockERC20.sol";

/**
 * @title Interact
 * @dev Script to interact with deployed PiggyBankFactory contract
 * @author Allan Kamau - Web3bridge Week 6 Assignment
 */
contract Interact is Script {
    PiggyBankFactory public factory;
    MockERC20 public token;
    
    function run() external {
        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable factoryAddress = payable(vm.envAddress("FACTORY_ADDRESS"));

        factory = PiggyBankFactory(factoryAddress);
        
        vm.startBroadcast(userPrivateKey);
        
        // Example interactions
        demonstrateETHPiggyBank();
        demonstrateTokenPiggyBank();
        
        vm.stopBroadcast();
    }
    
    function demonstrateETHPiggyBank() internal {
        console.log("\n=== ETH PIGGY BANK DEMO ===");
        
        // Create ETH piggy bank with 1 day lock period
        address ethBank = factory.createETHPiggyBank(1 days);
        console.log("Created ETH piggy bank at:", ethBank);
        
        PiggyBank bank = PiggyBank(payable(ethBank));
        
        // Deposit 1 ETH
        bank.depositETH{value: 1 ether}();
        console.log("Deposited 1 ETH");
        console.log("Current balance:", bank.getBalance());
        console.log("Lock expires in:", bank.getRemainingLockTime(), "seconds");
        
        // Check factory stats
        console.log("User's total ETH balance:", factory.getUserTotalETHBalance(msg.sender));
        console.log("User's piggy bank count:", factory.userPiggyBankCount(msg.sender));
    }
    
    function demonstrateTokenPiggyBank() internal {
        console.log("\n=== TOKEN PIGGY BANK DEMO ===");
        
        // Deploy a test token first (in real scenario, use existing token)
        token = new MockERC20("Demo Token", "DEMO", 18, 1000000);
        console.log("Deployed test token at:", address(token));
        
        // Create token piggy bank with 7 days lock period
        address tokenBank = factory.createTokenPiggyBank(address(token), 7 days);
        console.log("Created token piggy bank at:", tokenBank);
        
        PiggyBank bank = PiggyBank(payable(tokenBank));
        
        // Approve and deposit 1000 tokens
        uint256 depositAmount = 1000 * 10**18;
        token.approve(tokenBank, depositAmount);
        bank.depositToken(depositAmount);
        
        console.log("Deposited 1000 tokens");
        console.log("Current balance:", bank.getBalance());
        console.log("Lock expires in:", bank.getRemainingLockTime(), "seconds");
        
        // Check factory stats
        console.log("User's total token balance:", factory.getUserTotalTokenBalance(msg.sender, address(token)));
    }
    
    function demonstrateEmergencyWithdraw() external {
        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable factoryAddress = payable(vm.envAddress("FACTORY_ADDRESS"));
        address piggyBankAddress = vm.envAddress("PIGGY_BANK_ADDRESS");

        factory = PiggyBankFactory(factoryAddress);
        PiggyBank bank = PiggyBank(payable(piggyBankAddress));
        
        vm.startBroadcast(userPrivateKey);
        
        console.log("\n=== EMERGENCY WITHDRAW DEMO ===");
        console.log("Current balance:", bank.getBalance());
        console.log("Is lock expired:", bank.isLockExpired());
        
        if (!bank.isLockExpired()) {
            uint256 balance = bank.getBalance();
            if (balance > 0) {
                console.log("Performing emergency withdrawal with 3% penalty...");
                bank.emergencyWithdraw(balance);
                console.log("Emergency withdrawal completed");
                console.log("Factory penalty balance:", factory.getPenaltyETHBalance());
            }
        } else {
            console.log("Lock period expired, can withdraw without penalty");
        }
        
        vm.stopBroadcast();
    }
    
    function checkFactoryStats() external view {
        address payable factoryAddress = payable(vm.envAddress("FACTORY_ADDRESS"));
        PiggyBankFactory factoryContract = PiggyBankFactory(factoryAddress);
        
        console.log("\n=== FACTORY STATISTICS ===");
        (uint256 totalBanks, uint256 totalUsers, address adminAddress) = factoryContract.getFactoryStats();
        console.log("Total piggy banks:", totalBanks);
        console.log("Total unique users:", totalUsers);
        console.log("Factory admin:", adminAddress);
        console.log("ETH penalty balance:", factoryContract.getPenaltyETHBalance());
        console.log("=========================");
    }
}
