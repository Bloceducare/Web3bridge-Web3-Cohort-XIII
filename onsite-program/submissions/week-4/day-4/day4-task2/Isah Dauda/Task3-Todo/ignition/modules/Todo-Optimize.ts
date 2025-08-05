import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoModule = buildModule("TodoModule", (m) => {
  const Todo = m.contract("Todo");

  return { Todo };
});

export default TodoModule;

//Yes
