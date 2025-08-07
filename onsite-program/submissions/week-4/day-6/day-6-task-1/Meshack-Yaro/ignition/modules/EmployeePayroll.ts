// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const EmployeePayrollModule = buildModule("EmployeePayrollModule", (m) => {


  const employeePayroll = m.contract("Lock");

  return { employeePayroll };
});

export default EmployeePayrollModule;
