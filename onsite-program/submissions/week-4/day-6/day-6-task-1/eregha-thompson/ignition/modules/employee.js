import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeModule = buildModule("EmployeeModule", (m) => {
  const payroll = m.contract("payroll");
  return { payroll };
});

export default EmployeeModule;
