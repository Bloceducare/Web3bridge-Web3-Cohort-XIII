import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const { PRIVATE_KEY, ETHERSCAN_KEY, SEPOLIA_URL_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // sepolia: {
    //   url: SEPOLIA_URL_KEY,
    //   accounts: [`0x${PRIVATE_KEY}`],
    // },
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/Ly7PHEoJ2iAwPbFZfVbe5iunN09kSQC-",
      },
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY as string,
    },
  },
};

export default config;
