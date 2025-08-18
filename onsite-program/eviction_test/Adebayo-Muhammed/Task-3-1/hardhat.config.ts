import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: "https://ethereum-rpc.publicnode.com"
      },
      gas: "auto",
      gasPrice: "auto"
    }
  }
};

export default config;
