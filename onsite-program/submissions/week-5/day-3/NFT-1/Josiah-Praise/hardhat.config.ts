import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [process.env.PRIVATE_KEY!],
      gasPrice: "auto"
    },
    sepolia: {
      accounts: [process.env.PRIVATE_KEY!],
      url: 'https://eth-sepolia.g.alchemy.com/v2/oA3aWf4dW3KozyXiBJ5TiZHnXtykfedo'
    }
  },
  etherscan: {
    apiKey: {
      liskSepolia: "abc", // Dummy key for Lisk Sepolia,
      sepolia: "JNDFXW4CGVWCRHWBARPUH6IZ7UEVGQVIA4",
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  }
};

export default config;
