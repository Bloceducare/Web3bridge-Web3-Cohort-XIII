import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_KEY = vars.get("ETHERSCAN_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    ethereumSepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/lEYdMDPljN4TnRRZTGKR5",
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_KEY,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
