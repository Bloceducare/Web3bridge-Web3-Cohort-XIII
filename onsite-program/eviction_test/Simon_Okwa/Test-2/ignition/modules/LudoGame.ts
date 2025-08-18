// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const LudoGameModule = buildModule("LudoGameModule", (m) => {
  // Deploy token first
  const ludoToken = m.contract("LudoToken");

  // Parameterize stake amount (default: 1e18)
  const stakeAmount = m.getParameter("stakeAmount", 1000000000000000000n);

  // Deploy game with required constructor args
  const ludoGame = m.contract("LudoGame", [ludoToken, stakeAmount]);

  return { ludoToken, ludoGame };
});

export default LudoGameModule;
