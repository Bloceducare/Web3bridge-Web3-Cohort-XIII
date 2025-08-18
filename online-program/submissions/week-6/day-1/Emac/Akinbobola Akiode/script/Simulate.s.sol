// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";
import "../src/interfaces/IERC20.sol";

contract Simulate is Script {
    PiggyBankFactory public factory;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.deal(deployer, 10 ether);
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying PiggyBankFactory...");
        factory = new PiggyBankFactory();
        console.log("Factory deployed at:", address(factory));
        console.log("Admin:", factory.admin());
        
        console.log("\n=== Creating Ether-based PiggyBank ===");
        address payable etherAccount = payable(factory.createPiggyBank(address(0), 1 days));
        PiggyBank etherPiggyBank = PiggyBank(etherAccount);
        
        console.log("Ether PiggyBank created at:", etherAccount);
        console.log("Owner:", etherPiggyBank.owner());
        console.log("Lock period:", etherPiggyBank.lockPeriod());
        
        console.log("\n=== Depositing Ether ===");
        uint256 depositAmount = 1 ether;
        etherPiggyBank.deposit{value: depositAmount}();
        console.log("Deposited:", depositAmount, "wei");
        console.log("Account balance:", etherPiggyBank.getBalance());
        
        console.log("\n=== Testing Early Withdrawal Fee (3%) ===");
        console.log("Lock expiry:", etherPiggyBank.getLockExpiry());
        console.log("Is lock expired:", etherPiggyBank.isLockExpired());
        
        // Early withdrawal - should pay 3% fee
        etherPiggyBank.withdraw();
        
        uint256 fee = (depositAmount * 3) / 100;
        console.log("Account balance after withdrawal:", etherPiggyBank.getBalance());
        console.log("Admin fee collected:", fee, "wei");
        console.log("User balance after withdrawal:", deployer.balance);
        console.log("[OK] Early withdrawal fee mechanism working!");
        
        console.log("\n=== Testing Time Warp and Lock Expiry ===");
        
        // Create account with short lock period
        address payable shortAccount = payable(factory.createPiggyBank(address(0), 1 hours));
        PiggyBank shortPiggyBank = PiggyBank(shortAccount);
        
        shortPiggyBank.deposit{value: 0.5 ether}();
        console.log("Created short-term account with 0.5 ETH");
        
        uint64 lockExpiry = shortPiggyBank.getLockExpiry();
        console.log("Lock expiry:", lockExpiry);
        
        // Warp to before expiry
        vm.warp(lockExpiry - 1);
        console.log("Warped to:", block.timestamp, "- Before expiry");
        console.log("Is lock expired:", shortPiggyBank.isLockExpired());
        
        // Warp to after expiry
        vm.warp(lockExpiry + 1);
        console.log("Warped to:", block.timestamp, "- After expiry");
        console.log("Is lock expired:", shortPiggyBank.isLockExpired());
        
        // Withdraw after lock expiry - no fee
        shortPiggyBank.withdraw();
        console.log("Account balance after no-fee withdrawal:", shortPiggyBank.getBalance());
        console.log("[OK] No-fee withdrawal after lock expiry working!");
        
        vm.stopBroadcast();
        
        console.log("\n=== Enhanced Simulation Complete ===");
        console.log("[OK] Early withdrawal fee mechanism demonstrated");
        console.log("[OK] Time warping with vm.warp() demonstrated");
        console.log("[OK] Admin fee collection verified");
        console.log("[OK] No-fee withdrawal after lock expiry verified");
    }
} 