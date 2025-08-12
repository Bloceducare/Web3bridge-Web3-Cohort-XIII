// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ManageTeacherModule = buildModule("ManageTeacherModule", (m) => {
  const manageTeacher = m.contract("ManageTeacher");

  return { manageTeacher };
});

module.exports = ManageTeacherModule;
