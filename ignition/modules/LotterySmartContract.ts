// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotterySmartContractModule = buildModule("LotterySmartContractModule", (m) => {
  const lottery = m.contract("LotterySmartContract");

  return { lottery };
});

export default LotterySmartContractModule;
