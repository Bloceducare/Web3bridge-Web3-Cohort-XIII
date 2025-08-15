import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TimeDisplayNFTModule = buildModule("TimeDisplayNFTModule", (m) => {
  // No constructor args for TimeDisplayNFT
  const timeDisplayNFT = m.contract("TimeDisplayNFT");

  return { timeDisplayNFT };
});

export default TimeDisplayNFTModule;
