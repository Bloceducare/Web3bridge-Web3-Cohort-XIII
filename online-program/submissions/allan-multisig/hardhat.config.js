require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 4202,
    },
  },
  etherscan: {
    apiKey: {
      liskSepolia: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-explorer.lisk.com/api",  // ⚠️ Confirm if this is correct
          browserURL: "https://sepolia-explorer.lisk.com",
        },
      },
    ],
  },
};
