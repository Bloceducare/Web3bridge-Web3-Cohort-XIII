# SVG Clock NFT

Dynamic on-chain SVG NFT that displays current time using `block.timestamp`. Updates every time `tokenURI()` is queried.

## Features

- ⏰ **Dynamic Time**: Shows current UTC time from blockchain
- 🎨 **SVG Clock**: Clean, simple clock design
- ⛓️ **Fully On-Chain**: No external dependencies
- 🚀 **Sepolia Ready**: Configured for testnet deployment

## Quick Start

### 1. Setup Environment
```bash
# Create .env file with your keys
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "ETHERSCAN_API_KEY=your_etherscan_key_here" >> .env
echo "RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key" >> .env
echo "CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000" >> .env
```

### 2. Deploy Contract
```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast
```

### 3. Update Contract Address
```bash
# After deployment, update CONTRACT_ADDRESS in .env with the new address
```

### 4. Mint NFT
```bash
forge script script/Mint.s.sol:Mint --rpc-url $RPC_URL --broadcast
```

### 5. View on Rarible
- Go to [Rarible Testnet](https://testnet.rarible.com/)
- Connect wallet (Sepolia network)
- Check your profile for the NFT

## Contract Info

- **Name**: SVG Clock
- **Symbol**: SVGC
- **Standard**: ERC721
- **Solidity**: ^0.8.28
- **Network**: Sepolia Testnet

## Commands

```bash
# Build
forge build

# Test
forge test

# Load environment variables first
source .env

# Deploy (uses RPC_URL from .env)
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast

# Mint (uses RPC_URL and CONTRACT_ADDRESS from .env)
forge script script/Mint.s.sol:Mint --rpc-url $RPC_URL --broadcast

# Verify (after deployment)
forge verify-contract $CONTRACT_ADDRESS src/SVG_NFT.sol:SVG_NFT --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY --compiler-version 0.8.28
```

## Environment Variables

Your `.env` file should contain:
```bash
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**Important**: Always run `source .env` before executing forge commands to load the environment variables.

## Files

- `src/SVG_NFT.sol` - Main contract
- `script/Deploy.s.sol` - Deployment script
- `script/Mint.s.sol` - Minting script
- `foundry.toml` - Foundry configuration
