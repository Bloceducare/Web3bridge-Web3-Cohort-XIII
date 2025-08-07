// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



  
const EmployeeManagementModule = buildModule("EmployeeManagementModule", (m) => {
  const address = "0x58A8D815eE6D1DDd027341650139B21c3258172b";
  const employeeManagementModule = m.contract("EmployeeManagementSystem",[address]);  
    return {employeeManagementModule}
  });



export default EmployeeManagementModule;
