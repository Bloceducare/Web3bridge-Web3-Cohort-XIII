import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoModule = buildModule("TodoModule", (m) => {
  const TodoList = m.contract("TodoList");
  return { TodoList };
});



export default TodoModule;