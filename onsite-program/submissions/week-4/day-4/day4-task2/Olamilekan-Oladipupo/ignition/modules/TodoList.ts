
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoListModule = buildModule("TodoListModule", (m) => {

  const TodoList = m.contract("TodoList");
  return { TodoList };
});

export default TodoListModule;
