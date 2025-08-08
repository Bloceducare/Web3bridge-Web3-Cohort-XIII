// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const MultisigModule = buildModule("MultisigModule", (m) => {

  const multisig = m.contract("Multisig");
  const factory = m.contract("Factory")

  return { multisig, factory };
});

export default MultisigModule;
