import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
      gas: "auto",
      gasPrice: 200000000000, // 20 gwei
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/256455a9ddad477fb35c4ad464e88ba2",
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
