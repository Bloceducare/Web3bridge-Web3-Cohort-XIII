import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/_UsybjK1RuYQGzqTIQmyPdBUOLVviAJm", 
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: "BIJ7SB7262125HYSRYHX7XS58JII1SSVP2", 
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;