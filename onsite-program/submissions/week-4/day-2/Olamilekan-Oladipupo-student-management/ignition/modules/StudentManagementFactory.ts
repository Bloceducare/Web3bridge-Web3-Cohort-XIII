// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentManagementFactoryModule = buildModule("StudentManagementFactoryModule", (m) => {

  const studentManagementFactory = m.contract("studentManagementFactory");
  return { studentManagementFactory };
});

export default StudentManagementFactoryModule;

