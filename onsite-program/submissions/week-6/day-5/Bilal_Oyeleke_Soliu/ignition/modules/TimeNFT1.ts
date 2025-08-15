// ignition/modules/TimeNFT.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TimeNFTModule = buildModule("TimeNFTModule", (m) => {
  const time = m.contract("TimeNFT");
  return { time };
});

export default TimeNFTModule;
