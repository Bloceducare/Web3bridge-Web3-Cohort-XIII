import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrinNodeNFTModule = buildModule("TrinNodeNFTModule", (m) => {
  const nft = m.contract("TrinNodeNFT");
  return { nft };
});

export default TrinNodeNFTModule;
