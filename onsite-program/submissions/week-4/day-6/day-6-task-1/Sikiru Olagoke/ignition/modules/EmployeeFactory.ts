// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeFactoryModule = buildModule("EmployeeFactoryModule", (m) => {
  const employeeFactory = m.contract("EmployeeFactory");

  return { employeeFactory };
});

export default EmployeeFactoryModule;
