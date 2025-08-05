// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const BasicERC20Module = buildModule("BasicERC20Module", (m) => {
 


  const lock = m.contract("BasicERC20");

  return { BasicERC20: lock };
});
 
export default BasicERC20Module;
