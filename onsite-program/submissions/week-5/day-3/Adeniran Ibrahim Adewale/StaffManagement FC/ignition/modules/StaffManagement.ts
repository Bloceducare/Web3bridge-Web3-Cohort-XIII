// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StaffManagementModule = buildModule("StaffManagementModule", (m) => {

  const staffManagement = m.contract("StaffManagement");

  return { staffManagement };
});

export default StaffManagementModule;
