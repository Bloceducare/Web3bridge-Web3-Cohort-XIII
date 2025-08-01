import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();
const {URL_KEY, WALLET_KEY} = process.env
const config: HardhatUserConfig = {
  solidity: "0.8.2",
  networks: {
    // for testnet
    lisk: {
      url: process.env.RPC_URL,
      accounts: [`0x${WALLET_KEY}`],
      gasPrice: 1000000000,
    },
  },
};

export default config;
