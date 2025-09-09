// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/StakingToken.sol";
import "../src/StakingContract.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy StakeToken
        string memory name = "Stake Token";
        string memory symbol = "STK";
        uint256 initialSupply = 1000000; // 1 million tokens

        StakeToken stakeToken = new StakeToken(name, symbol, initialSupply);
        
        console.log("========== STAKE TOKEN DEPLOYMENT ==========");
        console.log("StakeToken deployed to:", address(stakeToken));
        console.log("Token Name:", name);
        console.log("Token Symbol:", symbol);
        console.log("Initial Supply:", initialSupply * 10**18);
        console.log("");

        // Step 2: Deploy StakingContract with the StakeToken address
        uint256 _initialApr = 1000;         // 10% APR
        uint256 _minLockDuration = 86400;   // 1 day
        uint256 _aprReductionPerThousand = 10; // 0.1% reduction per 1000 tokens
        uint256 _emergencyWithdrawPenalty = 20; // 20% penalty

        StakingContract stakingContract = new StakingContract(
            address(stakeToken),
            _initialApr,
            _minLockDuration,
            _aprReductionPerThousand,
            _emergencyWithdrawPenalty
        );

        console.log("========== STAKING CONTRACT DEPLOYMENT ==========");
        console.log("StakingContract deployed to:", address(stakingContract));
        console.log("Staking Token Address:", address(stakeToken));
        console.log("Initial APR:", _initialApr, "(10%)");
        console.log("Min Lock Duration:", _minLockDuration, "seconds (1 day)");
        console.log("APR Reduction Per Thousand:", _aprReductionPerThousand, "(0.1%)");
        console.log("Emergency Withdraw Penalty:", _emergencyWithdrawPenalty, "(20%)");
        console.log("");

        console.log("========== DEPLOYMENT SUMMARY ==========");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("StakeToken:", address(stakeToken));
        console.log("StakingContract:", address(stakingContract));

        vm.stopBroadcast();
    }
}
