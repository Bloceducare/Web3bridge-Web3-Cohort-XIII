require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    liskSepolia: {
      url: process.env.LISK_SEPOLIA_RPC, // store in .env
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      liskSepolia: process.env.LISK_SEPOLIA_API_KEY
    }
  }
};
