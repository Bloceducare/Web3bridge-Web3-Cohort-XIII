import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-verify";
import readlineSync from "readline-sync";

const PRIVATE_KEY = readlineSync.question("Enter your private key: ", { hideEchoBack: true });

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    'lisk-sepolia-testnet': {
      url: 'https://rpc.sepolia-api.lisk.com',
      chainId: 4202,
      accounts: [PRIVATE_KEY]
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
