// Hardhat Ignition module for deploying DynamicTimeNFT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const DynamicTimeNFTModule = buildModule("DynamicTimeNFTModule", (m) => {
  const nft = m.contract("DynamicTimeNFT", []); 
  return { nft };
})
export default DynamicTimeNFTModule;
