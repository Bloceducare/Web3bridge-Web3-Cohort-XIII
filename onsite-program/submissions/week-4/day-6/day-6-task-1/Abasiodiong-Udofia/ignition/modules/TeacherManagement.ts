// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TeacherManagementModule = buildModule("TeacherManagementModule", (m) => {
 

  const teacherManagementModule = m.contract("TeacherManagement");

  return { teacherManagementModule };
});

export default TeacherManagementModule;
