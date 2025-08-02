// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ErrorModule = buildModule("ErrorModule", (m) => {

  const Error = m.contract("Error");
  return { Error };
});

export default ErrorModule;

