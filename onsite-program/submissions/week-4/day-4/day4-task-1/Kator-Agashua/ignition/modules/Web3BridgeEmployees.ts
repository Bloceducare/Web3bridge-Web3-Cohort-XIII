// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const Web3BridgeEmployeesModule = buildModule("Web3BridgeEmployeesModule", (m) => {

  const Web3BridgeEmployees = m.contract("Web3BridgeEmployees");

  return { Web3BridgeEmployees };
});

export default Web3BridgeEmployeesModule;
