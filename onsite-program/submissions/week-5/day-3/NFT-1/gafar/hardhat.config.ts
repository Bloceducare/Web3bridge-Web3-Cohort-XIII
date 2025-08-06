import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const { ETHERSCAN_API_KEY, PRIVATE_KEY, SEPOLIA_URL_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    sepolia: {
      url: SEPOLIA_URL_KEY,
      accounts: [`${PRIVATE_KEY}`],
      chainId: 11155111,
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY?.toString() || "",
    },
  },
};

export default config;