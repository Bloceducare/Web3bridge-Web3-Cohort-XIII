import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();
const { LISK_URL_KEY, PRIVATE_KEY, ETHERSCAN_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  
  networks: {
    "flow": {
      url: LISK_URL_KEY,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY as string,
      "flow": "545", 
      "chainId": "545"
    },
    
  },
  sourcify: {
  enabled: false
}
};

export default config;




