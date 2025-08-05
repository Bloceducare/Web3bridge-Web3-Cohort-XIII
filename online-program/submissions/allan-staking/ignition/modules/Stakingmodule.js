// ignition/modules/StakingModule.js

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StakingModule", (m) => {
  // 1. Deploy TokenA
  const tokenA = m.contract("TokenA");

  // 2. Deploy TokenB
  const tokenB = m.contract("TokenB");

  // 3. Define lock period (in seconds), e.g., 7 days = 7 * 24 * 60 * 60
  const lockPeriod = 7 * 24 * 60 * 60;

  // 4. Deploy the Staking contract with tokenA, tokenB, and lockPeriod
  const staking = m.contract("Staking", [tokenA, tokenB, lockPeriod]);

  return { tokenA, tokenB, staking };
});
