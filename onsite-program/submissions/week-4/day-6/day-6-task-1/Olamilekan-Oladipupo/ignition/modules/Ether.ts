// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EtherModule = buildModule("EtherModule", (m) => {

  const Ether = m.contract("Ether");
  return { Ether };
});

export default EtherModule;

