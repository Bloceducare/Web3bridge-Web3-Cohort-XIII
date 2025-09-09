// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoGameModule = buildModule("LudoGame", (m) => {
  const ludo = m.contract("LudoGame");

  return { ludo };
});

export default LudoGameModule;
