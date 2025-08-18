import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LotteryModule = buildModule("LotteryModule", (m) => {

  const lottery = m.contract("Lottery", [1000000000000000]);

  return { lottery };
});

export default LotteryModule;