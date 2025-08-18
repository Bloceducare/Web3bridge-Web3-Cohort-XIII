require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LISK_SEPOLIA_RPC_URL = process.env.LISK_SEPOLIA_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "lisk-sepolia": {
      url: LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 4202,
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": ETHERSCAN_API_KEY || "dummy",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};