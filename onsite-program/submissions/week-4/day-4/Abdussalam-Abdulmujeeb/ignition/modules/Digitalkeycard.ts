// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DigitalkeycardModule = buildModule("DigitalkeycardSystemModule", (m) => {

  const digitalkeycard = m.contract("Digitalkeycard");

  return { digitalkeycard};
});

export default DigitalkeycardModule;

