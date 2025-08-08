// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const MultiSigModule = buildModule("MultiSigModule", (m) => {


  const multisig = m.contract("MultiSig");

  return { multisig };
});

export default MultiSigModule;
