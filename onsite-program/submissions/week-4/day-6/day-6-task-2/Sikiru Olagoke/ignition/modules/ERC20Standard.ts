// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20StandardModule = buildModule("ERC20StandardModule", (m) => {
  const erc20Standard = m.contract("ERC20Standard");

  return { erc20Standard };
});

export default ERC20StandardModule;
