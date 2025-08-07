// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigModule = buildModule("MultiSig", (m) => {
  const multisig = m.contract("MultiSigFactory"); 

  return { multisig };
});

export default MultiSigModule;