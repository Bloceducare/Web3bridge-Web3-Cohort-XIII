import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Staking", (m) => {
    const token1 = m.contract("Token1");
    const token2 = m.contract("Token2");
    
    const stakingContract = m.contract("StakingContract", [
        token1,
        token2,
        7 * 24 * 60 * 60 // 7 days lock period
    ]);
    
    return { token1, token2, stakingContract };
});