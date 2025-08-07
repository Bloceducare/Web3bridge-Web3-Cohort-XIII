// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoFactoryModule = buildModule("TodoFactoryModule", (m) => {
  const todoFactory = m.contract("TodoFactory");

  return { todoFactory };
});

export default TodoFactoryModule;
