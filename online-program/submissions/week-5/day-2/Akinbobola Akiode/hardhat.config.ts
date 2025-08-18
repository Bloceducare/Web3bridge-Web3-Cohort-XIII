require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  defaultNetwork: "lisk-sepolia",

  networks: {
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com", 
      accounts: vars.has("PRIVATE_KEY") ? [vars.get("PRIVATE_KEY")] : [],
      chainId: 4202, 
      gasPrice: 1000000000, // 1 gwei
      gas: 3000000, // 3M gas limit
    },
  },
  sourcify: {
    enabled: false,
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": "123"
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
};
