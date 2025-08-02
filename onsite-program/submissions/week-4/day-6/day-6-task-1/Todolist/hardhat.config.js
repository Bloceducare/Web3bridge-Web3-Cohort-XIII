require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const { PRIVATE_KEY, CORE_RPC, CORESCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    coredao: {
      url: CORE_RPC || "https://rpc.test.btcs.network",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
      chainId: 1115,
      gasPrice: 1_000_000_000, // 1 Gwei
      type: "legacy", // Use legacy type txs (EIP-1559 not supported well on some testnets)
    },
  },
  etherscan: {
    apiKey: {
      coredao: CORESCAN_API_KEY,
    },
    customChains: [
      {
        network: "coredao",
        chainId: 1115,
        urls: {
          apiURL: "https://scan.test.btcs.network/api",
          browserURL: "https://scan.test.btcs.network",
        },
      },
    ],
  },
};
