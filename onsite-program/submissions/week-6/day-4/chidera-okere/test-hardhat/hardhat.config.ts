import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-ignition-ethers'
import '@typechain/hardhat'
import { vars } from 'hardhat/config'

const PRIVATE_KEY = vars.get('PRIVATE_KEY')

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // Enable IR pipeline to handle "Stack too deep"
    }
  },
  networks: {
    hardhat: {}, // Local Hardhat network for testing
    liskTestnet: {
      url: 'https://rpc.sepolia-api.lisk.com',
      accounts: [PRIVATE_KEY],
      chainId: 4202
    }
  },
  etherscan: {
    apiKey: {
      'lisk-sepolia': '123' // Replace with actual API key if required
    },
    customChains: [
      {
        network: 'lisk-sepolia',
        chainId: 4202,
        urls: {
          apiURL: 'https://sepolia-blockscout.lisk.com/api',
          browserURL: 'https://sepolia-blockscout.lisk.com'
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  }
}

export default config
