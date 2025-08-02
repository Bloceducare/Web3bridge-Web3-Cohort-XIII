// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const management_systemModule = buildModule("management_systemModule", (m) => {
  const management_system = m.contract("management_system"); // no constructor arguments

  return { management_system};
});

export default management_systemModule;