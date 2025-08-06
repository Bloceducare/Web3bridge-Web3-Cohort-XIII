// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Erc20FactoryContractModule = buildModule("Erc20FactoryContractModule", (m) => {
    
  const Erc20Factory = m.contract("Erc20Factory");
  return { Erc20Factory };
});

export default Erc20FactoryContractModule;

