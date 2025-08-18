# Uniswap V2 Eviction Task 2

## Task Description
Interact with the remaining Uniswap V2 functions that weren't covered in class with screenshots for each interaction made.

## Project Setup
This project demonstrates various Uniswap V2 interactions using Hardhat with TypeScript and mainnet forking.

### Prerequisites
- Node.js and npm
- Alchemy or Infura mainnet RPC URL

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with your mainnet RPC URL:
```
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Compilation
```bash
npx hardhat compile
```

## Uniswap V2 Functions Implemented

### 1. Create Pair and Fund Liquidity
**Script**: `scripts/createAndFundPair.ts`
**Function**: Creates a new SHIB/LINK pair and adds initial liquidity
**Screenshot**: `screenshots/SHIB_LINKpairandfund.png`
**Log**: `screenshots/createAndFundPair.log`

**Key Interactions**:
- Impersonates whale address: `0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503`
- Creates pair between SHIB (`0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE`) and LINK (`0x514910771AF9Ca656af840dff83E8264EcF986CA`)
- Adds 1 SHIB and 5,800,000 LINK as initial liquidity

### 2. Add Liquidity
**Script**: `scripts/addLiquidity.ts`
**Function**: Adds liquidity to existing USDT/DAI pair
**Screenshot**: `screenshots/Addliquidity(USDT_DAI).png`
**Log**: `screenshots/addLiquidity.log`

**Key Interactions**:
- Uses existing USDT/DAI pair
- Adds 10 USDT and 10 DAI to the pool
- Implements 5% slippage protection

### 3. Remove Liquidity
**Script**: `scripts/removeLiquidity.ts`
**Function**: Removes liquidity from USDT/DAI pair
**Screenshot**: `screenshots/Removeliquidity(USDT_DAI).png`
**Log**: `screenshots/removeLiquidity.log`

**Key Interactions**:
- First adds liquidity, then removes half of LP tokens
- Shows before/after balances for both tokens
- Implements slippage protection

### 4. Swap Exact Tokens for Tokens
**Script**: `scripts/swapExactTokenForToken.ts`
**Function**: Swaps exact amount of USDT for DAI
**Screenshot**: `screenshots/SwapexactUSDT _DAI.png`
**Log**: `screenshots/swapExactTokensForTokens.log`

**Key Interactions**:
- Swaps 1000 USDT for DAI
- Uses `swapExactTokensForTokens` function
- Implements 5% slippage protection

### 5. Swap Tokens for Exact Tokens
**Script**: `scripts/swapTokensForExactToken.ts`
**Function**: Swaps USDT for exact amount of DAI
**Screenshot**: `screenshots/swapUSDTforexactDAI.png`
**Log**: `screenshots/swapTokensForExactTokens.log`

**Key Interactions**:
- Swaps USDT for exactly 1000 DAI
- Uses `swapTokensForExactTokens` function
- Implements 20% slippage protection

## Available Scripts

```bash
# Create and fund SHIB/LINK pair
npm run create-and-fund-pair

# Add liquidity to USDT/DAI pair
npm run add-liquidity

# Remove liquidity from USDT/DAI pair
npm run remove-liquidity

# Swap exact USDT for DAI
npm run swap-exact

# Swap USDT for exact DAI
npm run swap-for-exact
```

## Contract Addresses Used

- **Uniswap V2 Router**: `0xf164fC0Ec4E93095b804a4795bBe1e041497b92a`
- **Uniswap V2 Factory**: `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **DAI**: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
- **LINK**: `0x514910771AF9Ca656af840dff83E8264EcF986CA`
- **SHIB**: `0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE`
- **Whale Address**: `0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503`

## Screenshots Documentation

All screenshots are stored in the `screenshots/` folder with correspon