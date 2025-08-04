require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    lisk: {
      url: "https://rpc.sepolia-api.lisk.com", // Lisk Sepolia RPC
      accounts: [process.env.PRIVATE_KEY] // Your deployer wallet's private key (no quotes around the variable)
    },
  },
  etherscan: {
    apiKey: {
      lisk: process.env.LISKSCAN_API_KEY
    },
    customChains: [
      {
        network: "lisk",
        chainId: 4202, // Chain ID for Lisk Sepolia
        urls: {
          apiURL: "https://sepolia-explorer.lisk.com/api", // LiskScan API URL
          browserURL: "https://sepolia-explorer.lisk.com"
        }
      }
    ]
  }
};
