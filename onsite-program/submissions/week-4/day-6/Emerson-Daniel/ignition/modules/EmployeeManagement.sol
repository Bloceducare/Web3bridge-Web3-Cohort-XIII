import { IgnitionModuleBuilder } from "@nomicfoundation/hardhat-ignition";

export default (m: IgnitionModuleBuilder) => {
  const employeeManagement = m.contract("EmployeeManagement");
  return { employeeManagement };
};