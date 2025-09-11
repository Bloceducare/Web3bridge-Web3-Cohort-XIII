// Contract Addresses
export const CONTRACT_ADDRESSES = {
  STAKING_CONTRACT: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`,
} as const;

// Network Configuration
export const NETWORKS = {
  LISK_SEPOLIA: {
    id: 4202,
    name: 'Lisk Sepolia',
    rpcUrl: 'https://rpc.sepolia-api.lisk.com',
    blockExplorer: 'https://sepolia-blockscout.lisk.com',
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Staking dApp',
  DESCRIPTION: 'Decentralized staking application with rewards',
} as const;