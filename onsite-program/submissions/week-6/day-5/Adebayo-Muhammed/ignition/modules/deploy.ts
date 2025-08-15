import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DynamicClockNFTModule", (m) => {
  const dynamicClockNFT = m.contract("DynamicClockNFT");

  return {
    dynamicClockNFT,
  };
});