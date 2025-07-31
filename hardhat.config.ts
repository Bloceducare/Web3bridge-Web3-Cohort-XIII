import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
<<<<<<< HEAD

const config: HardhatUserConfig = {
  solidity: "0.8.28",
=======
import { vars } from "hardhat/config";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");


const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY as string],
    },
  },

  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
>>>>>>> e166642c59505ee4f7c6d1e74068b9136f37e806
};

export default config;
