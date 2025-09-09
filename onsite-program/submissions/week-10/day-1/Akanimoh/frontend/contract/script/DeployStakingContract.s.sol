// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/StakingContract.sol";

contract DeployStakingContract is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address stakeTokenAddress = vm.envAddress("STAKE_TOKEN_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deployment parameters as specified
        uint256 _initialApr = 1000;         // 10% APR
        uint256 _minLockDuration = 86400;   // 1 day
        uint256 _aprReductionPerThousand = 10; // 0.1% reduction per 1000 tokens
        uint256 _emergencyWithdrawPenalty = 20; // 20% penalty

        StakingContract stakingContract = new StakingContract(
            stakeTokenAddress,
            _initialApr,
            _minLockDuration,
            _aprReductionPerThousand,
            _emergencyWithdrawPenalty
        );

        console.log("StakingContract deployed to:", address(stakingContract));
        console.log("Staking Token Address:", stakeTokenAddress);
        console.log("Initial APR:", _initialApr, "(10%)");
        console.log("Min Lock Duration:", _minLockDuration, "seconds (1 day)");
        console.log("APR Reduction Per Thousand:", _aprReductionPerThousand, "(0.1%)");
        console.log("Emergency Withdraw Penalty:", _emergencyWithdrawPenalty, "(20%)");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.stopBroadcast();
    }
}
