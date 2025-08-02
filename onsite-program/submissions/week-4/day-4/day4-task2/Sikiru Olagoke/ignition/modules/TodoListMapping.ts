// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoListMappingModule = buildModule("TodoListMappingModule", (m) => {
  const todoListMapping = m.contract("TodoListMapping");

  return { todoListMapping };
});

export default TodoListMappingModule;
