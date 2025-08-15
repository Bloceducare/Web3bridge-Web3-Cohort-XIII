import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY, SEPOLIA_URL_KEY, ETHERSCAN_API_KEY } = process.env;
module.exports = {
  solidity: "0.8.30",
    networks: {
    sepolia: {
      url: SEPOLIA_URL_KEY,
     accounts: [`0x${PRIVATE_KEY}`],

    },
  },
  etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY || "",
},

  };