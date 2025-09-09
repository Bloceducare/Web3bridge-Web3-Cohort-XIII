// Contract addresses and configuration for Sepolia testnet
export const STAKING_CONTRACT_ADDRESS =
  "0xb222356dc0e5b14ddB54b1caa21C248Cb969bE65";
export const TOKEN_CONTRACT_ADDRESS =
  "0x28EEDebFE67Efa43e753A6E7DdB852186424283C";

export const NETWORK_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    currency: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: import.meta.env.VITE_RPC_URL,
  },
};

export const REFRESH_INTERVAL = 10000; // 10 seconds
export const MIN_LOCK_DURATION = 90; // 90 seconds
export const EMERGENCY_PENALTY = 50; // 50% penalty

// Staking Protocol Configuration
export const PROTOCOL_CONFIG = {
  INITIAL_APR: 250, // 250%
  APR_REDUCTION: 0.5, // 0.5% per 1000 tokens staked
  MIN_LOCK_DURATION: 90, // 90 seconds
  EMERGENCY_PENALTY: 50, // 50% penalty
  REWARD_INTERVAL: 10, // 10 seconds interval
  MINIMUM_APR: 10, // 10% minimum APR
};

export const UI_CONFIG = {
  REFRESH_INTERVAL: 10000, // 10 seconds
  MAX_DECIMALS: 6,
  TOAST_DURATION: 5000,
};
