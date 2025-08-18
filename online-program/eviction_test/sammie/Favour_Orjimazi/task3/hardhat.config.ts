import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv";

dotenv.config();


const config: HardhatUserConfig = {
  solidity: "0.8.20",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
