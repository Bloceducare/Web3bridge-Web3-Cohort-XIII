import { HardhatUserConfig,vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks:{
    sepolia: {
      url : `https://rpc.sepolia-api.lisk.com`,
      accounts : [`0x${PRIVATE_KEY}`]
    },
  },
  etherscan:{
    apiKey: ETHERSCAN_API_KEY
  }
};

export default config;
