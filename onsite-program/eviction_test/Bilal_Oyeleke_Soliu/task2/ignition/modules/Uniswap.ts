// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UniswapModule = buildModule("UniswapModule", (m) => {

  const uniswap = m.contract("Uniswap");

  return { uniswap };
});

export default UniswapModule;
