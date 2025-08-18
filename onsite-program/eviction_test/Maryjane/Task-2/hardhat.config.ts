import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
      }
    }
  }
};