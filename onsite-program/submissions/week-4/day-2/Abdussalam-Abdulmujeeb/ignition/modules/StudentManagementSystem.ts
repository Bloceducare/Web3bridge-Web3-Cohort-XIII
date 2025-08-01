// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentManagementSystemModule = buildModule("StudentManagementSystemModule", (m) => {

  const studentmanagementsystem = m.contract("StudentManagementSystem");

  return { studentmanagementsystem };
});

export default StudentManagementSystemModule;
