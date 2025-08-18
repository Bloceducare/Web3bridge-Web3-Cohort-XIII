import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-verify";

require("dotenv").config();

const { PRIVATE_KEY, ETHERSCAN_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    'lisk-sepolia': {
      url: 'https://rpc.sepolia-api.lisk.com',
      chainId: 4202,
      accounts: [PRIVATE_KEY as string]
    },
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia-testnet': '123abc'
    },
    customChains: [
      {
        network: "lisk-sepolia-testnet",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  },
   sourcify: {
  enabled: true
}
};

export default config;