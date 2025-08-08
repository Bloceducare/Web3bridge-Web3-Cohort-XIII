// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MultiSigFactoryModule = buildModule("MultiSigFactoryModule", (m) => {
  

  const multiSigFactory = m.contract("MultiSigFactory");

  return { multiSigFactory };
});

export default MultiSigFactoryModule;
