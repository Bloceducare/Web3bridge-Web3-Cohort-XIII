import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";



const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
     hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/LHTpq2xCLi-A7U6IW4NZK",
      }
    },
  }
}

export default config;