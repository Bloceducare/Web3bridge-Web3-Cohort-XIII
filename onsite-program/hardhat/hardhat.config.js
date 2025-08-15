require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const SEPOLIA_URL_KEY = process.env.SEPOLIA_URL_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.30",
  networks: {
    sepolia: {
      url: SEPOLIA_URL_KEY,
      accounts: [PRIVATE_KEY ? `0x${PRIVATE_KEY}` : ""],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};
