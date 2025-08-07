// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SmanagmentModule = buildModule("SmanagementModule", (m) => {
  
  const smanagement = m.contract("Smanagement");

  return { smanagement };
});

export default SmanagmentModule;