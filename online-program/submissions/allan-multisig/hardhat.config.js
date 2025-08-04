require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.18",
  networks: {
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [process.env.PRIVATE_KEY], // Store your private key in .env
    },
  },
};
