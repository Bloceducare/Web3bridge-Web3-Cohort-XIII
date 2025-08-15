// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/PiggyBankFactory.sol";
import "../src/PiggyBank.sol";

contract InteractScript is Script {
    function run() external {
        // read env vars
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");

        // start broadcasting transactions using the private key
        vm.startBroadcast(deployerPrivateKey);

        // cast the address to the contract type
        PiggyBankFactory factory = PiggyBankFactory(payable(factoryAddress));

        console.log("=== Creating Piggy Bank ===");
        address piggyBankAddress = factory.createPiggyBank();
        console.log("Created PiggyBank at:");
        console.log("  address:", piggyBankAddress);

        PiggyBank piggyBank = PiggyBank(piggyBankAddress);

        console.log("\n=== Creating Savings Accounts ===");

        // Create ETH savings account with 30 day lock
        uint256 ethAccountId = piggyBank.createSavingsAccount(
            30 days,
            address(0)
        );
        console.log("Created ETH account with ID:");
        console.log("  id:", ethAccountId);

        // Create another ETH account with 90 day lock
        uint256 ethAccount2Id = piggyBank.createSavingsAccount(
            90 days,
            address(0)
        );
        console.log("Created ETH account (90 days) with ID:");
        console.log("  id:", ethAccount2Id);

        console.log("\n=== Depositing ETH ===");

        // Deposit 0.1 ETH to first account
        piggyBank.depositETH{value: 0.1 ether}(ethAccountId);
        console.log("Deposited 0.1 ETH to account:");
        console.log("  id:", ethAccountId);

        // Deposit 0.2 ETH to second account
        piggyBank.depositETH{value: 0.2 ether}(ethAccount2Id);
        console.log("Deposited 0.2 ETH to account:");
        console.log("  id:", ethAccount2Id);

        console.log("\n=== Account Details ===");

        // Get account details for first account
        (
            uint256 balance1,
            uint256 lockPeriod1,
            uint256 startTime1,
            address token1,
            bool isActive1,
            bool isLocked1
        ) = piggyBank.getSavingsAccount(ethAccountId);

        console.log("Account details (first):");
        console.log("  id:", ethAccountId);
        console.log("  balance:", balance1);
        console.log("  lockPeriod:", lockPeriod1);
        console.log("  startTime:", startTime1);
        console.log("  token:", token1);
        // console.log doesn't have a bool overload in all versions — print as 0/1
        console.log("  isActive (0/1):", isActive1 ? 1 : 0);
        console.log("  isLocked (0/1):", isLocked1 ? 1 : 0);

        // Get account details for second account
        (
            uint256 balance2,
            uint256 lockPeriod2,
            uint256 startTime2,
            address token2,
            bool isActive2,
            bool isLocked2
        ) = piggyBank.getSavingsAccount(ethAccount2Id);

        console.log("Account details (second):");
        console.log("  id:", ethAccount2Id);
        console.log("  balance:", balance2);
        console.log("  lockPeriod:", lockPeriod2);
        console.log("  startTime:", startTime2);
        console.log("  token:", token2);
        console.log("  isActive (0/1):", isActive2 ? 1 : 0);
        console.log("  isLocked (0/1):", isLocked2 ? 1 : 0);

        // Get user statistics
        console.log("\n=== User Statistics ===");
        address user = vm.addr(deployerPrivateKey);

        uint256 piggyBankCount = factory.getUserPiggyBankCount(user);
        uint256 totalBalance = factory.getUserTotalBalance(user, address(0));
        uint256 totalAccounts = factory.getUserTotalSavingsAccounts(user);

        console.log("User:");
        console.log("  address:", user);
        console.log("  Total Piggy Banks:", piggyBankCount);
        console.log("  Total ETH Balance:", totalBalance);
        console.log("  Total Savings Accounts:", totalAccounts);

        vm.stopBroadcast();

        console.log("\n=== Next Steps ===");
        console.log("1. Try early withdrawal to test penalty system");
        console.log(
            "2. Wait for lock period to expire for penalty-free withdrawal"
        );
        console.log(
            "3. Factory owner can withdraw penalties using withdrawETHPenalties()"
        );
    }
}
