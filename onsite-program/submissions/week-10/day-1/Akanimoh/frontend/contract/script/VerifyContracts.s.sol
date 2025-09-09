// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract VerifyContracts is Script {
    function run() external view {
        // Get addresses from environment variables
        address stakeTokenAddress = vm.envAddress("STAKE_TOKEN_ADDRESS");
        address stakingContractAddress = vm.envAddress("STAKING_CONTRACT_ADDRESS");
        
        console.log("========== CONTRACT VERIFICATION ==========");
        console.log("StakeToken Address:", stakeTokenAddress);
        console.log("StakingContract Address:", stakingContractAddress);
        
        console.log("");
        console.log("Constructor args encoded:");
        console.log("StakeToken args:");
        console.log(vm.toString(abi.encode("Stake Token", "STK", 1000000)));
        console.log("");
        console.log("StakingContract args:");
        console.log(vm.toString(abi.encode(stakeTokenAddress, 1000, 86400, 10, 20)));
        console.log("");
        console.log("Use these for manual verification on Etherscan");
    }
}
