// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  const ludoGame = m.contract("LudoGame");

  return { ludoGame };
});

export default LudoGameModule;
