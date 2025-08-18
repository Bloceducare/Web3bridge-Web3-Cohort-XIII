import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks :{
    hardhat: {
      forking: {
        url: "https://ethereum.publicnode.com",
        blockNumber: 16000000,
      },
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  }
};

export default config;
