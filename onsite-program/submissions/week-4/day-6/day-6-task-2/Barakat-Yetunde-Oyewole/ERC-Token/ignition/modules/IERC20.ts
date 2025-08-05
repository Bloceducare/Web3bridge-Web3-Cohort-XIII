// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const ERCModule = buildModule("ERCModule", (m) => {
  
  const ERC20 = m.contract("MyToken");

  return { ERC20 };
});

export default ERCModule;