require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: {
      liskSepolia: "abc"
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