// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const MultisigFactoryModule = buildModule("MultisigFactoryModule", (m) => {


  const multisigFactory = m.contract("MultisigFactory");

  return { multisigFactory };
});

export default MultisigFactoryModule;
