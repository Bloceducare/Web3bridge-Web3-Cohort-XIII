# Uniswap Swap Project

A Foundry project for interacting with Uniswap V2 on Ethereum mainnet using mainnet forking.

## Setup

1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
2. Clone and install dependencies: `forge install`
3. Configure `.env` with your API keys
4. Build the project: `forge build`

## Environment Variables

- `MAINNET_RPC_URL`: Your Alchemy mainnet RPC URL
- `PRIVATE_KEY`: Your private key for transactions

## Testing & Running

### Run tests:
```bash
forge test
```

**Test Coverage:**
- ✅ EIP-712 permit signature generation
- ✅ Domain separator validation
- ✅ Permit hash computation

### Test the script (simulation only):
```bash
forge script script/PermitSwap.s.sol --fork-url mainnet
```

### Run the script with real transactions:
```bash
forge script script/PermitSwap.s.sol --fork-url mainnet --broadcast
```

## Features

- Mainnet forking for realistic testing
- EIP-712 permit-based token approvals
- Uniswap V2 token swapping
- WETH to DAI swap example
- No smart contract deployment required 