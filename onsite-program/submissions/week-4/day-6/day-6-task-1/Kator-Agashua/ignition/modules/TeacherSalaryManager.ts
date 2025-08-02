// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TeacherSalaryManagerModule = buildModule("TeacherSalaryManagerModule", (m) => {

  const teacherSalaryManager = m.contract("TeacherSalaryManager");

  return { teacherSalaryManager };
});

export default TeacherSalaryManagerModule;
