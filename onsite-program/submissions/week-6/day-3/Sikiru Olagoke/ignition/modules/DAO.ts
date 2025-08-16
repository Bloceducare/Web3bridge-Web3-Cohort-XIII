// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DAOModule = buildModule("DAOModule", (m) => {
  const dao = m.contract("DAO");

  return { dao };
});

export default DAOModule;
