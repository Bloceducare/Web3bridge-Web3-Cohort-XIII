import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const { LISK_URL_KEY, PRIVATE_KEY, ETHERSCAN_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    "lisk-sepolia": {
      url: LISK_URL_KEY || "https://rpc.sepolia-api.lisk.com",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      chainId: 4202,
    },
  },

  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY as string,
      "lisk-sepolia": "abc123",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },

  sourcify: {
    enabled: false
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;
