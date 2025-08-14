import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000,
      type: 'http',
    },
  },
};

export default config;
