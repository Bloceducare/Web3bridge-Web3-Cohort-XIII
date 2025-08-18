# Uniswap V2 Mainnet Forking Scripts

This project contains TypeScript scripts for interacting with Uniswap V2 on Ethereum mainnet using Hardhat's mainnet forking feature. The scripts demonstrate liquidity removal and token swapping operations.

## 🚀 Features

- **Remove Liquidity**: Remove liquidity from USDC/DAI pair
- **Remove Liquidity ETH**: Remove liquidity from DAI/ETH pair
- **Swap ETH for Tokens**: Swap ETH for exact amount of DAI tokens
- **Mainnet Forking**: All operations run on a forked mainnet environment
- **Error Handling**: Comprehensive error handling and validation
- **TypeScript Support**: Full TypeScript support with proper typing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Alchemy API key for mainnet forking

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Update your Alchemy API key in `hardhat.config.ts` if needed (already configured)

3. Compile contracts:
```bash
npm run compile
```

## 🎯 Usage

### Running Scripts

Use the predefined npm scripts to run each operation:

```bash
# Remove liquidity from USDC/DAI pair
npm run remove-liquidity

# Remove liquidity from DAI/ETH pair
npm run remove-liquidity-eth

# Swap ETH for exact DAI tokens
npm run swap-eth-for-tokens
```

### Manual Execution

You can also run scripts directly with Hardhat:

```bash
# Remove liquidity
npx hardhat run Script/removeLiquidity.ts

# Remove liquidity ETH
npx hardhat run Script/removeLiquidityEth.ts

# Swap ETH for tokens
npx hardhat run Script/swapETHForExactTokens.ts
```

## 📁 Project Structure

```
├── contracts/
│   ├── IERC20.sol              # ERC20 interface
│   ├── IUniswapV2Factory.sol   # Uniswap V2 Factory interface
│   └── IUniswapV2Router02.sol  # Uniswap V2 Router interface
├── Script/
│   ├── removeLiquidity.ts      # Remove USDC/DAI liquidity
│   ├── removeLiquidityEth.ts   # Remove DAI/ETH liquidity
│   └── swapETHForExactTokens.ts # Swap ETH for DAI
├── hardhat.config.ts           # Hardhat configuration with mainnet forking
└── package.json               # Project dependencies and scripts
```

## 🔧 Configuration

The project is configured to fork Ethereum mainnet at a specific block number. The configuration is in `hardhat.config.ts`:

```typescript
networks: {
  hardhat: {
    forking: {
      url: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
    },
  },
}
```

## 📊 Script Details

### 1. Remove Liquidity (USDC/DAI)
- **File**: `Script/removeLiquidity.ts`
- **Purpose**: Removes liquidity from USDC/DAI Uniswap V2 pair
- **Features**: Balance checking, approval, liquidity removal, result logging

### 2. Remove Liquidity ETH (DAI/ETH)
- **File**: `Script/removeLiquidityEth.ts`
- **Purpose**: Removes liquidity from DAI/ETH Uniswap V2 pair
- **Features**: ETH balance tracking, LP token management, ETH withdrawal

### 3. Swap ETH for Exact Tokens
- **File**: `Script/swapETHForExactTokens.ts`
- **Purpose**: Swaps ETH for exact amount of DAI tokens
- **Features**: Price calculation, slippage protection, balance tracking

## 🛡️ Safety Features

- **Input Validation**: Checks for zero balances before operations
- **Error Handling**: Comprehensive try-catch blocks with detailed error messages
- **Transaction Confirmation**: Waits for transaction confirmation before proceeding
- **Balance Tracking**: Shows before/after balances for transparency

## 🧪 Testing

Run tests to validate functionality:

```bash
npm test
```

## 🔍 Troubleshooting

### Common Issues

1. **"Property does not exist on type 'BaseContract'"**
   - Fixed with proper type assertions (`as any`)
   - Contracts need to be compiled first

2. **"Insufficient funds"**
   - The impersonated account needs sufficient ETH/tokens
   - Check account balances before running scripts

3. **"Transaction reverted"**
   - Check if LP tokens exist for removal operations
   - Verify token approvals are successful

### Debug Mode

Add console logs or use Hardhat's built-in debugging:

```bash
npx hardhat run Script/yourScript.ts --verbose
```

## 📝 Notes

- All scripts use account impersonation for testing purposes
- Mainnet forking allows testing without spending real ETH
- Scripts include comprehensive logging for monitoring operations
- Type assertions are used to handle TypeScript compilation issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational purposes. Use at your own risk.
