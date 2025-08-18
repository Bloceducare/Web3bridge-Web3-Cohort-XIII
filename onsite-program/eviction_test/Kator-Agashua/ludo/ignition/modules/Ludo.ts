// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const LudoModule = buildModule("LudoModule", (m) => {

  const ludo = m.contract("Ludo");

  return { ludo };
});

export default LudoModule;
