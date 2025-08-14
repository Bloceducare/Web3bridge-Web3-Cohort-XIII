import { HardhatUserConfig,vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// require("dotenv").config()

// const { PRIVATE_KEY,ETHERSCAN_KEY ,LISK_SEPOLIA_URL_KEY } = process.env
const config: HardhatUserConfig = {
  solidity: "0.8.30",
  // ...rest of your config...
  networks: {
    lisksepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [vars.get("PRIVATE_KEY")],
    },
  },
  etherscan: {
    apiKey:   {
      "lisk-sepolia": "123"
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
};

export default config;