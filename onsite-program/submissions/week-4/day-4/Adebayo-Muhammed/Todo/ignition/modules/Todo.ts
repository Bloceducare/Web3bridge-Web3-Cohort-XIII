import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoListModule = buildModule("TodoList", (m) => {
  const todoList = m.contract("TodoList");

  return { todoList };
});

export default TodoListModule;