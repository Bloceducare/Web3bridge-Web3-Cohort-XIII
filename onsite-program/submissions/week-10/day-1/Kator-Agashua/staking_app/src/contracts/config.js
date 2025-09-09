// Contract configuration
export const CONTRACT_ADDRESS = "0xB99AaaB0bDa1279CDB26ADBB347625fe3832BEBA"; // Replace with actual contract address
export const CHAIN_ID = 1; // Replace with the actual chain ID (1 for Ethereum mainnet, 5 for Goerli, etc.)
export const SUPPORTED_CHAINS = [1, 5, 11155111]; // Mainnet, Goerli, Sepolia

// RPC URLs for different networks
export const RPC_URLS = {
  1: "https://eth-mainnet.g.alchemy.com/v2/your-api-key", // Replace with your API key
  5: "https://eth-goerli.g.alchemy.com/v2/your-api-key",
  11155111: "https://eth-sepolia.g.alchemy.com/v2/WSvWHfsttntyGMWJOCSU-8qkICJX4pf6"
};