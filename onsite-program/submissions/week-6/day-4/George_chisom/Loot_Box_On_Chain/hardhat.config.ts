import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable } from "hardhat/config";

// Ensure you have dotenv installed (`npm install dotenv`) and a .env file with the variables
import "dotenv/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    liskSepolia: {
      type: "http",
      chainType: "l1",
      url:
        configVariable("LISK_SEPOLIA_RPC_URL") ||
        "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [configVariable("LISK_SEPOLIA_PRIVATE_KEY")],
    },
  },
};

export default config;
