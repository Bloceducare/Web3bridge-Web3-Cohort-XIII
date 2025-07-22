import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const ALCHEMY_PRIVATE_KEY = vars.get("ALCHEMY_PRIVATE_KEY");
const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
      sepolia: {
        url:`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_PRIVATE_KEY}`,
        accounts: [PRIVATE_KEY]
      }
    },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

export default config;
