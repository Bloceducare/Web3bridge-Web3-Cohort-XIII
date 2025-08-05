import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [
        "94ad5237461fa92300d5864d6acce25940aab2c25f23aec9f03928379b486e75",
      ],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      liskSepolia: "abc", // Dummy key for Lisk Sepolia
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
};

export default config;
