// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiFactoryModule = buildModule("MultiFactoryModule", (m) => {

  const multi = m.contract("MultisigFactory");

  return { multi };
});

export default MultiFactoryModule;
