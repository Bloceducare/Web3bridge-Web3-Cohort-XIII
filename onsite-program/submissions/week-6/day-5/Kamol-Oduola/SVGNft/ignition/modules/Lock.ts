import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DynamicTimeNFTModule = buildModule("DynamicTimeNFTModule", (m) => {
  const timeNft = m.contract("TimeNFT");

  return { timeNft };
});

export default DynamicTimeNFTModule;
