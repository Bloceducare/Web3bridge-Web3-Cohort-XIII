// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AccessManagementModule = buildModule("AccessManagementModule", (m) => {
  const accessManagement = m.contract("AccessManagement");

  return { accessManagement };
});

export default AccessManagementModule;
