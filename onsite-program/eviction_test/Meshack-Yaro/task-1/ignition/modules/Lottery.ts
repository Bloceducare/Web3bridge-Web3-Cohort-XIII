// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryModule = buildModule("LotteryModule", (m) => {
  const entryFee = m.getParameter("entryFee", "1000000000000000000");

  const lottery = m.contract("Lottery", [entryFee]);

  return { lottery };
});

export default LotteryModule;
