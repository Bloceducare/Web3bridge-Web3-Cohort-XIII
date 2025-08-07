// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TodoMapping = buildModule("TodoMapping", (m) => {

  const todoMapping = m.contract("TodoMapping")

  return {todoMapping};
});

export default TodoMapping;
