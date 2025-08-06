import { HardhatUserConfig,vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ALCHEMY_PRIVATE_KEY = vars.get("ALCHEMY_PRIVATE_KEY")
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY")
const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks:{
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_PRIVATE_KEY}`,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
export default config;