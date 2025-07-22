// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GreetModule = buildModule("GreeterModule", (m) => {
  const lock = m.contract("Greeter");
  return { lock };
});

export default GreetModule;
