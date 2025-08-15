import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY"); 

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/LHTpq2xCLi-A7U6IW4NZK", 
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: "ACKE6KWD3PXC8214SMXC7BAMEE4ENBN4XT"
    }
  },
  sourcify: {
    enabled: false
  }
};

export default config;
