// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AccessModule = buildModule("AccessModule", (m) => {

  const access = m.contract("AccessMgt", [], {
  });

  return { access };
});

export default AccessModule;
