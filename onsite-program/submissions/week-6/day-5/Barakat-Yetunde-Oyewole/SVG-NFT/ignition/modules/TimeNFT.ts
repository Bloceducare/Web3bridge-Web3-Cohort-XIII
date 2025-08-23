import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TimeNFTModule = buildModule("TimeNFTModule", (m) => {
  const timeNFT = m.contract("TimeNFT");

  return { timeNFT };
});

export default TimeNFTModule;
