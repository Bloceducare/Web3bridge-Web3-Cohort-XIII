
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoModule = buildModule("TodoListModule", (m) => {
    const lock = m.contract("TodoList");
    return { lock };
});

export default TodoModule;
