// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleMultisigFactoryModule = buildModule("SimpleMultisigFactoryModule", (m) => {
  const simpleMultisig = m.contract("SimpleMultisigFactory");
  // simpleMultisig.setConstructorArgs(
  //   m.address("signer1"),
  //   m.address("signer2"),
  //   m.address("signer3")
  // );
  return { simpleMultisig };
});

export default SimpleMultisigFactoryModule;
