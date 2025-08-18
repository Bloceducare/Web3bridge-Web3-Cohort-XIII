// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StudentManagerModule", (m) => {
  const studentManager = m.contract("StudentManager");

  return { studentManager };
});
