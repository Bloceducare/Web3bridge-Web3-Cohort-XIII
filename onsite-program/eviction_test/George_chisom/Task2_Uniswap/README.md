# Uniswap V2 Comprehensive Function Interactions

A complete implementation of all Uniswap V2 Router functions with proper interfaces, forking setup, and comprehensive testing scripts.

## Overview

This project demonstrates interaction with all major Uniswap V2 Router02 functions including:

- Liquidity management (add/remove)
- Token swapping (exact input/output)
- ETH swapping
- Fee-on-transfer token support
- Permit-based transactions
- All variations and edge cases

## Features

- **Complete Interface Coverage**: IERC20, IUniswapV2Pair, IUniswapV2Router, IUniswap
- **Mainnet Forking**: Uses Hardhat forking to interact with real Uniswap contracts
- **Real Token Testing**: Tests with actual USDC, DAI, and WETH
- **Comprehensive Scripts**: 14 individual scripts covering all functions
- **Gas Optimization**: Proper gas estimation and transaction handling
- **Error Handling**: Robust error handling and validation

## Project Structure

```
Task2_Uniswap/
├── contracts/
│   └── interfaces/
│       ├── IERC20.sol
│       ├── IUniswap.sol
│       ├── IUniswapV2Pair.sol
│       └── IUniswapV2Router.sol
├── scripts/
│   ├── 01_addLiquidity.ts
│   ├── 02_removeLiquidity.ts
│   ├── 03_swapExactTokensForTokens.ts
│   ├── 04_swapTokensForExactTokens.ts
│   ├── 05_swapExactETHForTokens.ts
│   ├── 06_swapETHForExactTokens.ts
│   ├── 07_swapExactTokensForETH.ts
│   ├── 08_swapTokensForExactETH.ts
│   ├── 09_swapExactTokensForTokensSupportingFeeOnTransferTokens.ts
│   ├── 10_swapExactETHForTokensSupportingFeeOnTransferTokens.ts
│   ├── 11_swapExactTokensForETHSupportingFeeOnTransferTokens.ts
│   ├── 12_removeLiquidityETHSupportingFeeOnTransferTokens.ts
│   ├── 13_removeLiquidityWithPermit.ts
│   ├── 14_removeLiquidityETHWithPermit.ts
│   └── runAllUniswapFunctions.ts
├── screenshots/
└── README.md
```

## Installation and Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Set Up Environment Variables**

```bash
cp .env.example .env
# Edit .env with your Ethereum mainnet RPC URL
```

3. **Compile Contracts**

```bash
npm run compile
```

## Usage

### Run Individual Functions

**Working Scripts (Fixed Gas Issues):**

```bash
# Liquidity Management
npm run add-liquidity              # Add USDC/DAI liquidity
npm run remove-liquidity           # Remove USDC/DAI liquidity
npm run add-remove-liquidity       # Complete liquidity demo

# Token Swapping (All 6 swap functions)
npm run test-all-swaps            # Test all swap functions:
                                  # - swapExactTokensForTokens
                                  # - swapTokensForExactTokens
                                  # - swapExactETHForTokens
                                  # - swapETHForExactTokens
                                  # - swapExactTokensForETH
                                  # - swapTokensForExactETH

# Fee-on-Transfer Support (3 functions)
npm run test-fee-functions        # Test fee-on-transfer functions:
                                  # - swapExactTokensForTokensSupportingFeeOnTransferTokens
                                  # - swapExactETHForTokensSupportingFeeOnTransferTokens
                                  # - swapExactTokensForETHSupportingFeeOnTransferTokens

# Run Everything
npm run demo-all                  # Run all demos in sequence
```

### Individual Function Testing

For individual function testing, use:

```bash
npm run swap-exact-tokens         # Single swap function test
```

## Function Details

### 1. Liquidity Management

#### addLiquidity

- Adds liquidity to USDC/DAI pair
- Handles token approvals
- Shows liquidity tokens received

#### removeLiquidity

- Removes liquidity from existing position
- Returns underlying tokens
- Demonstrates LP token management

### 2. Token Swapping

#### swapExactTokensForTokens

- Swaps exact amount of input tokens
- Uses slippage protection
- Shows exchange rates

#### swapTokensForExactTokens

- Swaps tokens for exact output amount
- Calculates required input
- Demonstrates precise output control

### 3. ETH Swapping

#### swapExactETHForTokens

- Swaps exact ETH for tokens
- Handles ETH → WETH conversion
- Shows ETH/token exchange rates

#### swapETHForExactTokens

- Swaps ETH for exact token amount
- Calculates ETH requirement
- Refunds excess ETH

#### swapExactTokensForETH

- Swaps exact tokens for ETH
- Converts WETH → ETH automatically
- Shows token/ETH rates

#### swapTokensForExactETH

- Swaps tokens for exact ETH amount
- Precise ETH output control
- Efficient token usage

### 4. Fee-on-Transfer Token Support

#### swapExactTokensForTokensSupportingFeeOnTransferTokens

- Handles tokens with transfer fees
- Conservative slippage settings
- Accounts for fee deductions

#### swapExactETHForTokensSupportingFeeOnTransferTokens

- ETH swaps with fee tokens
- Protects against fee losses
- Robust error handling

#### swapExactTokensForETHSupportingFeeOnTransferTokens

- Fee token to ETH swaps
- Handles variable outputs
- Fee-aware calculations

#### removeLiquidityETHSupportingFeeOnTransferTokens

- Remove liquidity with fee tokens
- Accounts for transfer fees
- Safe withdrawal process

### 5. Permit-based Functions

#### removeLiquidityWithPermit

- Uses EIP-712 signatures
- Gas-efficient approvals
- Demonstrates permit pattern

#### removeLiquidityETHWithPermit

- ETH liquidity with permits
- Signature-based approvals
- Advanced DeFi patterns

## Contract Addresses

### Mainnet Contracts Used

- **Uniswap V2 Router**: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`
- **Uniswap V2 Factory**: `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`

### Test Account

- **Asset Holder**: `0xf584f8728b874a6a5c7a8d4d387c9aae9172d621`
  - Large USDC and DAI balances
  - Used for all test interactions

## Screenshots

Take screenshots of each function execution and save them in the `screenshots/` directory with the following naming convention:

```
screenshots/
├── 01_addLiquidity.png
├── 02_removeLiquidity.png
├── 03_swapExactTokensForTokens.png
├── 04_swapTokensForExactTokens.png
├── 05_swapExactETHForTokens.png
├── 06_swapETHForExactTokens.png
├── 07_swapExactTokensForETH.png
├── 08_swapTokensForExactETH.png
├── 09_swapExactTokensForTokensSupportingFeeOnTransferTokens.png
├── 10_swapExactETHForTokensSupportingFeeOnTransferTokens.png
├── 11_swapExactTokensForETHSupportingFeeOnTransferTokens.png
├── 12_removeLiquidityETHSupportingFeeOnTransferTokens.png
├── 13_removeLiquidityWithPermit.png
└── 14_removeLiquidityETHWithPermit.png
```

## Technical Notes

### Forking Setup

- Uses Ethereum mainnet fork at block 18,500,000
- Impersonates whale account for testing
- Real contract interactions with actual liquidity

### Gas Optimization

- Efficient approval patterns
- Proper slippage calculations
- Optimized transaction ordering

### Error Handling

- Comprehensive try-catch blocks
- Meaningful error messages
- Graceful failure handling

### Security Considerations

- Slippage protection on all swaps
- Deadline enforcement
- Input validation

## Development Team

Developed by George Chisom for Web3bridge Cohort XIII

## License

MIT License
