import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");


const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia : {
      url: "https://eth-sepolia.g.alchemy.com/v2/wHwbkttFi9IOFoM5Wzh31Gw1IvNHL-lt",
      accounts: [PRIVATE_KEY]

  },
},
  etherscan:{
    apiKey: [ETHERSCAN_API_KEY]
  },
};
export default config;
