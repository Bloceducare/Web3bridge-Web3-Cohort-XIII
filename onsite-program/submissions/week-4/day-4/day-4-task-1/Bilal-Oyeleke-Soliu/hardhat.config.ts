import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const LISK_URL_KEY = process.env.LISK_URL_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LISK_EXPLORER_KEY = process.env.LISK_EXPLORER_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    'lisk-sepolia-testnet': {
      url: 'https://rpc.sepolia-api.lisk.com'
    },
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia-testnet': LISK_EXPLORER_KEY
    },
    customChains: [
      {
        network: "lisk-sepolia-testnet",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
};

export default config;
