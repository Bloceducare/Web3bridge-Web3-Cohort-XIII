
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const { PRIVATE_KEY, ETHERSCAN_API_KEY, LISK_RPC_URL } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com'
    },
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia': 'empty'
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
  }
};

export default config;
