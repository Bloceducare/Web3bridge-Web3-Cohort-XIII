// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const FactoryEmployeeManagement = buildModule("FactoryEmployeeManagement", (m) => {

  const factoryEmployeeManagement = m.contract("FactoryEmployeeManagementSystem");

return {factoryEmployeeManagement};
});

export default FactoryEmployeeManagement;