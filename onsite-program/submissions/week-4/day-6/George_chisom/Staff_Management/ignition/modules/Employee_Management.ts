import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeManagementModule = buildModule(
  "EmployeeManagementModule",
  (m) => {
    const token = m.contract("EmployeeManagement");

    return { token };
  }
);

export default EmployeeManagementModule;
