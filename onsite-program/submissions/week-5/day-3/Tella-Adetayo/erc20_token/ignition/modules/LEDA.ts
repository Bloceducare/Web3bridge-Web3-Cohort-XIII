// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LEDAModule = buildModule("LEDAModuleV2", (m) => {
  const leda = m.contract("LEDAFactory"); 
  
  return { leda };
});

export default LEDAModule;