// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryGameModule = buildModule("LotteryGame", (m) => {

  const lottery_Game = m.contract("LotteryGame");

  return { lottery_Game };
});

export default LotteryGameModule;
