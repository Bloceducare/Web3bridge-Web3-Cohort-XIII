import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";

import readlineSync from "readline-sync";

// Interactive CLI input
const PRIVATE_KEY = readlineSync.question("Enter your private key: ", { hideEchoBack: true });
const RPC_URL = readlineSync.question("Enter your Lisk Sepolia RPC URL: ");

const config: HardhatUserConfig = {
  defaultNetwork: "lisk",
  networks: {
    lisk: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 4202,
    },
  },
  solidity: "0.8.30",
  sourcify: {
  enabled: true
}
};

export default config;
