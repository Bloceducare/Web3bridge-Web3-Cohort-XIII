// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20Module = buildModule("ERC20Module", (m) => {
  const ERC20 = m.contract("ERC20"); // no constructor arguments

  return {ERC20};
});

export default ERC20Module;