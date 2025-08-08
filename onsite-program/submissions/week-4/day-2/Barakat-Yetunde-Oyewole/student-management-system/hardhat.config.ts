import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";
require("dotenv").config();
const {LISK_SEPOLIA_URL} = process.env;;

const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY');
const PRIVATE_KEY = vars.get('PRIVATE_KEY');
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
     // for testnet
    'lisk-sepolia': {
      url: LISK_SEPOLIA_URL,
      accounts: [PRIVATE_KEY as string],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },

  
};

export default config;
