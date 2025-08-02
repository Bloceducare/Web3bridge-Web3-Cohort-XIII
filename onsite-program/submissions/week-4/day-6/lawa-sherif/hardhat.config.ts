require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Local Hardhat network
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Lisk Sepolia Testnet
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4202,
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": "no-api-key-needed", // Lisk Sepolia uses Blockscout
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
