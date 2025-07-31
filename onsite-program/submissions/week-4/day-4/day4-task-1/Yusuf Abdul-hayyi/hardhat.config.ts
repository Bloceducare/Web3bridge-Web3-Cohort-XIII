import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();


const {LISK_RPC_URL, ETHERSCAN_API_KEY, PRIVATE_KEY} = process.env;

const config: HardhatUserConfig = {
 solidity: "0.8.28",
 networks: {
   'lisk-sepolia-testnet': {
     url: LISK_RPC_URL,
     accounts:[`0x${PRIVATE_KEY}`]
   },
 },
 etherscan: {
   apiKey: {
     'lisk-sepolia-testnet': 'empty'
   },
  },
}

export default config;
