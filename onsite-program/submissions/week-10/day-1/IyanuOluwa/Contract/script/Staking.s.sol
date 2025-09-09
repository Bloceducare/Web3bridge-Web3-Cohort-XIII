// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Staking} from "../src/Staking.sol";

interface IERC20 {
  function approve(address spender, uint256 amount) external returns (bool);
}

contract StakingDeployScript is Script {
 

  function run() external {
    uint256 pk = vm.envUint("PRIVATE_KEY");
    address stakingToken = vm.envAddress("STAKING_TOKEN");
    address rewardToken = vm.envAddress("REWARD_TOKEN");
    uint256 rewardRate = vm.envUint("REWARD_RATE");
    uint256 lockDuration = vm.envUint("LOCK_DURATION");

    uint256 fundAmount = vm.envOr("FUND_REWARDS", uint256(0));
    address deployer = vm.addr(pk);
    address owner = vm.envOr("OWNER", address(0));
    if (owner == address(0)) owner = deployer;

    vm.startBroadcast(pk);

    Staking staking = new Staking(stakingToken, rewardToken, rewardRate, lockDuration);

    if (fundAmount > 0) {
      require(IERC20(rewardToken).approve(address(staking), fundAmount), "approve failed");
      staking.fundRewards(fundAmount);
    }

    if (owner != deployer) {
      staking.transferOwnership(owner);
    }

    vm.stopBroadcast();
  }
}