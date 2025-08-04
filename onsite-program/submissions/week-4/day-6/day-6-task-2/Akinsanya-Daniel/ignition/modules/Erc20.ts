// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const Erc20Module = buildModule("Erc20Module", (m) => {

  const initialAmount = 2000;

  const erc20Module = m.contract("Erc20",[initialAmount]);
  return {erc20Module};
 
})

export default Erc20Module;
