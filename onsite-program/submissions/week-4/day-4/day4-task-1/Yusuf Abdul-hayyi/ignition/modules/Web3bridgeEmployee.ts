// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const Web3bridgeEmployeeModule = buildModule("Web3bridgeEmployeeModule", (m) => {
  
  const web3bridgeEmployee = m.contract("Web3bridgeEmployee");

  return { web3bridgeEmployee };
});

export default Web3bridgeEmployeeModule;
