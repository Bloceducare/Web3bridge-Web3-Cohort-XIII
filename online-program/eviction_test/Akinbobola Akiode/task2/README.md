# Uniswap V2 Integration Project

A Hardhat project demonstrating Uniswap V2 interactions including token swaps, liquidity management, and pair creation.

## Features

- Token swapping (exact and reverse)
- Liquidity management (add/remove)
- Pair creation and funding
- Mainnet forking for testing

## Prerequisites

- Node.js 18+
- npm or yarn
- Ethereum mainnet RPC endpoint

## Installation

```bash
git clone <repository-url>
cd task2
npm install
```

## Configuration

Create `.env` file:
```env
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
```

## Usage

### Add Liquidity
```bash
npx hardhat run scripts/addLiquidity.ts --network hardhat
```

### Remove Liquidity
```bash
npx hardhat run scripts/removeLiquidity.ts --network hardhat
```

### Create and Fund Pair
```bash
npx hardhat run scripts/createAndFundPair.ts --network hardhat
```

### Swap Tokens
```bash
npx hardhat run scripts/swapExactTokenForToken.ts --network hardhat
npx hardhat run scripts/swapTokensForExactToken.ts --network hardhat
```

## Project Structure

```
├── contracts/          # Smart contract interfaces
├── scripts/            # Interaction scripts
├── screenshots/        # Operation screenshots
└── hardhat.config.ts  # Hardhat configuration
```

## License

Educational purposes only.
