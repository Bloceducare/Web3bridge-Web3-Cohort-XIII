// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const LudoModule = buildModule("LudoModule", (m) => {
  const ludoToken = m.contract("LudoToken", [parseEther("1000")]);

  const ludo = m.contract("LudoGame", [ludoToken]);

  return { ludo };
});

export default LudoModule;
