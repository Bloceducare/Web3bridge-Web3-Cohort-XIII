// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3garageManagementModule = buildModule("Web3garageManagementModule", (m) => {

  const Web3garageManagement = m.contract("Web3garageManagement");
  return { Web3garageManagement };
});

export default Web3garageManagementModule;