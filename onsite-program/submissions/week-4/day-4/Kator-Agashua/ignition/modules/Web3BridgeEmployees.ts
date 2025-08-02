// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const Web3BridgeEmployeesModule = buildModule("Web3BridgeEmployeesModule", (m) => {

  const Web3BridgeEmployeesModule = m.contract("Web3BridgeEmployees");

  return { Web3BridgeEmployeesModule };
});

export default Web3BridgeEmployeesModule;
