import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import dotenv from "dotenv";

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
    networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};

export default config;
