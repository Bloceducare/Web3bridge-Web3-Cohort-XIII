// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const GatedDAOModule = buildModule("GatedDAOModule", (m) => {
  

  const gatedDao = m.contract("GatedDao");

  return { gatedDao };
});

export default GatedDAOModule;
