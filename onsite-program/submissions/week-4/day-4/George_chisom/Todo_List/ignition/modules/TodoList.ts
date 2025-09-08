import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoListModule = buildModule("TodoListModule", (m) => {
  const list = m.contract("TodoList");

  return { list };
});

export default TodoListModule;