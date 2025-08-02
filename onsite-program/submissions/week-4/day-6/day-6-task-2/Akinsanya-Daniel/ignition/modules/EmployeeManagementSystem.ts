// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



  
const EmployeeManagementModule = buildModule("EmployeeManagementModule", (m) => {
  const employeeManagementModule = m.contract("EmployeeManagementSystem");  
    return {employeeManagementModule}
  });



export default EmployeeManagementModule;
