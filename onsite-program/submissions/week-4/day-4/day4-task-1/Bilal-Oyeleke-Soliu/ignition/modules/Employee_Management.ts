// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmployeeModule = buildModule("EmployeeModule", (m) => {

  const employeeManage = m.contract("Web3BridgeGarage"); 

  return { employeeManage };
});

export default EmployeeModule;

