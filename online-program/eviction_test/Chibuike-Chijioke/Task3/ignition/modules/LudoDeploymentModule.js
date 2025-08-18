const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LudoDeploymentModule", (m) => {
  const tokenName = "AuroraToken";
  const tokenSymbol = "AURA";
  const tokenDecimals = 18;
  const initialSupply = 0;

  const tokenContract = m.contract("AuroraToken", [
    tokenName,
    tokenSymbol,
    tokenDecimals,
    initialSupply,
  ]);

  const stakeAmount = m.getParameter("stakeAmount", "10000000000000000000");

  const gameContract = m.contract("LudoArena", [tokenContract, stakeAmount]);

  return { tokenContract, gameContract };
});
