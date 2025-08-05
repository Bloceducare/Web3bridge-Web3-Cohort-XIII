// ignition/modules/StakingModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

const StakingModule = buildModule("StakingModule", (m) => {
    // Deploy TokenA
    const tokenA = m.contract("TokenA", []);

    // Deploy TokenB
    const tokenB = m.contract("TokenB", []);

    // Deploy StakingContract
    const stakingContract = m.contract("StakingContract", [
        tokenA,
        tokenB,
        LOCK_PERIOD,
    ]);

    // Initialize staking contract
    m.call(stakingContract, "_setStakingContract", []);

    return {
        tokenA,
        tokenB,
        stakingContract,
    };
});

export default StakingModule;