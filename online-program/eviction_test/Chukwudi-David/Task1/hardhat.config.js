require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_KEY = process.env.API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",

  networks: {
    celo: {
      url: "https://celo-alfajores.drpc.org",
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    },
  },

  etherscan: {
    apiKey: "TC2A91ZBBZMFAXS229RCGGGJ8EMET5799R",

    customChains: [
    {
      network: "alfajores",
      chainId: 44787,
      urls: {
        apiURL: "https://alfajores.celoscan.io/api",
        browserURL: "https://alfajores.celoscan.io",
      },
    },
  ],
  },
  sourcify: {
    enabled: true
  },

};
