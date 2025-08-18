require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config()

const { LISK_SEPOLIA_URL, PRIVATE_KEY} = process.env;


module.exports = {
  solidity: "0.8.19",
  networks: {
    'lisk-sepolia': {
      url: LISK_SEPOLIA_URL,
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000,
    },
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
          apiURL: "https://explorer.lisk.io/api",
          browserURL: "https://explorer.lisk.io/"
        }
      }
    ]
  }
};
