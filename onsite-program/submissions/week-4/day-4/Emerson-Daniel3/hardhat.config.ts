import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();
const { URL_KEY, WALLET_KEY, ETHERSCAN_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  
  networks: {
    lisk: {
      url: process.env.RPC_URL,
      accounts: [`0x${WALLET_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY as string,
    },
  },
};

export default config;
