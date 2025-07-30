require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.23",
  networks: {
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.WALLET_KEY],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      "lisk-sepolia": "123",
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
  sourcify: {
    enabled: true,
  },
};
