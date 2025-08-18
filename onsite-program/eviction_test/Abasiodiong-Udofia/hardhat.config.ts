import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

import dotenv from "dotenv";

dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY as string;


const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    "lisk-sepolia": {
      type: "http",
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.SEPOLIA_PRIVATE_KEY as string],
      gasPrice: 1000000000,
    },
  },
  
};

export default config;
