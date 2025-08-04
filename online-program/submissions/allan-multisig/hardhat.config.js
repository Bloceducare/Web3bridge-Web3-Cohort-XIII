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
      liskSepolia: "your-api-key-if-needed"  // optional: "" if no API key is needed
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-explorer.lisk.com/api",  // ← You must confirm this API endpoint from Lisk Explorer docs
          browserURL: "https://sepolia-explorer.lisk.com",   // ← This is the block explorer base URL
        },
      },
    ],
  },
};
