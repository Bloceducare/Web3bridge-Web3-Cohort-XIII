// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggybankFactoryModule = buildModule("PiggybankFactoryModule", (m) => {
  const piggyFactory = m.contract("PiggybankFactory");

  return { piggyFactory };
});

export default PiggybankFactoryModule;
