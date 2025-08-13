import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenGatedDAOModule = buildModule("TokenGatedDAOModule", (m) => {
  // Deploy NFT contract first
  const nftContract = m.contract("DAOMemberNFT", []);
  
  // Deploy DAO contract with NFT address as parameter
  const daoContract = m.contract("TokenGatedDAO", [nftContract]);
  
  return {
    nftContract,
    daoContract,
  };
});

export default TokenGatedDAOModule;