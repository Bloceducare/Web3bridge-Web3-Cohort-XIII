import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";
require("dotenv").config();

const { LISK_SEPOLIA_URL } = process.env;
const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_KEY = vars.get("ETHERSCAN_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    "lisk-sepolia": {
      url: LISK_SEPOLIA_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY as string,
    },
    customChains: [
      {
        network: "lisk-sepolia",
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
