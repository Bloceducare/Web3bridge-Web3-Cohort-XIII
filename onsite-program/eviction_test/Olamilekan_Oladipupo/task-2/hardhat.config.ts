import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks:{
    hardhat:{
      forking: {
        url: `https://rpc.mevblocker.io`
      },
      initialBaseFeePerGas: 0
      
    },
  },
};

export default config;


initialBaseFeePerGas: 0
