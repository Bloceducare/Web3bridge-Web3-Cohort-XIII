// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20FactoryModule = buildModule("ERC20FactoryModule", (m) => {
  const erc20Factory = m.contract("ERC20Factory");

  return { erc20Factory };
});

export default ERC20FactoryModule;
