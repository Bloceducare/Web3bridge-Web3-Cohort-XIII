import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { vars } = require("hardhat/config");

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ALCHEMY_RPC_URL = vars.get("ALCHEMY_RPC_URL");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY")

const config: HardhatUserConfig = {
  solidity: "0.8.28",

 networks: {
    sepolia: {
      chainId: 11155111,
      url: ALCHEMY_RPC_URL,
      accounts: [PRIVATE_KEY as string]
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
