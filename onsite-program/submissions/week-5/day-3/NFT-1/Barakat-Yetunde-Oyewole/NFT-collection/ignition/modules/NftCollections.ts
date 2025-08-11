import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const NftModule = buildModule("NftModule", (m) => {
  
  const NFT = m.contract("DecentralizedNFT");

  return { NFT };
});

export default NftModule;