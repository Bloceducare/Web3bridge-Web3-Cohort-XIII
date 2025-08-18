import { HardhatUserConfig, vars } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  defaultNetwork: 'hardhat',

  networks: {
    hardhat: {
      chainId: 1337,
    },
    liskSepolia: {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: vars.has('PRIVATE_KEY') ? [vars.get('PRIVATE_KEY')] : [],
      chainId: 4202,
    },
  },

  etherscan: {
    apiKey: {
      liskSepolia: 'abc',
    },
    customChains: [
      {
        network: 'liskSepolia',
        chainId: 4202,
        urls: {
          apiURL: 'https://sepolia-blockscout.lisk.com/api',
          browserURL: 'https://sepolia-blockscout.lisk.com/',
        },
      },
    ],
  },
};

export default config;
