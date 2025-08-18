import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { vars } from "hardhat/config";

const PRIVATE_KEY = vars.get("PRIVATE_KEY")

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    lisk_sepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [PRIVATE_KEY]
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/3v_hKHYxum5Uzvp0j1Zwy",
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: "BIJ7SB7262125HYSRYHX7XS58JII1SSVP2"
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
            apiURL: "https://sepolia-blockscout.lisk.com/api",
            browserURL: "https://sepolia-blockscout.lisk.com"
        }
      },
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
};

export default config;
