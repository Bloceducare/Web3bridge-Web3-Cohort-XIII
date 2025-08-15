import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY"); 

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/LHTpq2xCLi-A7U6IW4NZK", 
      accounts: [PRIVATE_KEY]
    },
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: "ACKE6KWD3PXC8214SMXC7BAMEE4ENBN4XT", 
      "lisk-sepolia": "123" // dummy or actual key if needed
    },
    customChains: [
      {
        network: "lisk-sepolia", 
        chainId: 4202, 
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
