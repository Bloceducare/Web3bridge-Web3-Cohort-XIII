// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const StudentManagementSystemModule = buildModule("StudentManagementSystemModule", (m) => {

  const studentManagement = m.contract("StudentManagementSystem");

  return { studentManagement };
});

export default StudentManagementSystemModule;
