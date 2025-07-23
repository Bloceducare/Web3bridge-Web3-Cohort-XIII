import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const LISK_PRIVATE_KEY = vars.get("LISK_PRIVATE_KEY");
const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.30",
  networks: {
    lisk: {
      url: LISK_PRIVATE_KEY,
      chainId: 4202,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

export default config;
//deployed cotract address :  0xC25ad06105fA43F789a63Ef1a21e8A3E3918E064