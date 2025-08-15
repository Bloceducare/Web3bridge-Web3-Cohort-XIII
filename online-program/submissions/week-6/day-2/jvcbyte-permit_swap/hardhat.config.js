require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        enabled: true
      },
      chainId: 1, // Match mainnet chain ID
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 1,
      accounts: [PRIVATE_KEY]
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      gasPrice: 5000000000, // 5 gwei
      accounts: [PRIVATE_KEY]
    }
  },

  etherscan: {
    apiKey: vars.get("ETHERSCAN_API_KEY"),
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://explorer.celo.org/alfajores/api",
          browserURL: "https://explorer.celo.org/alfajores",
        },
      },
    ],
  },
};
    