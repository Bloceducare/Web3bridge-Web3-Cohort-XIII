// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const IBADAN_20Module = buildModule("IBADAN_20Module", (m) => {
   const IBADAN_20 = m.contract("ERC_20_FACTORY");

  return { IBADAN_20 };
});

export default IBADAN_20Module;
