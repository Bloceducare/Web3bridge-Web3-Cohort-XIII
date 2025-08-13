// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ValDAOModule = buildModule("ValDAOModule", (m) => {

  const ValDAO = m.contract("ValDAO", [], {});

  return { ValDAO };
});

export default ValDAOModule;
