// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const PermitSwapModule = buildModule("PermitSwapModule", (m) => {

  const permitswap = m.contract("PermitSwap");

  return {permitswap };
});

export default PermitSwapModule;
