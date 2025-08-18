import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: "0.8.0",
  typechain: {
    outDir: "typechain",
    target: "ethers-v6", 
  },
  networks: {
    hardhat: {},
  },
};

export default config;

