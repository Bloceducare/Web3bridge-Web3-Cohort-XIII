// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryModule = buildModule("LotteryModule", (m) => {

  const lottery = m.contract("Lottery", [1000000000000000]);

  return { lottery };
});

export default LotteryModule;
