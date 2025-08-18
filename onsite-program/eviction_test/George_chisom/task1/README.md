# Lottery Smart Contract

A decentralized lottery smart contract built with Solidity and Hardhat. Players can join by paying exactly 0.01 ETH, and when 10 players have joined, a winner is automatically selected to receive the entire prize pool.

### Key Functions

- `enterLottery()`: Join the lottery by sending exactly 0.01 ETH
- `getPlayers()`: View current players in the lottery
- `getPlayerCount()`: Get the number of current players
- `getCurrentPrizePool()`: View the current prize pool amount
- `getLotteryInfo()`: Get comprehensive lottery information

## Deployment

### Contract Address (Lisk Sepolia)

```
Contract Address: [TO_BE_UPDATED_AFTER_DEPLOYMENT]
```

### Network Details

- **Network**: Lisk Sepolia Testnet
- **Chain ID**: 4202
- **RPC URL**: https://rpc.sepolia-api.lisk.com

## Installation and Setup

1. **Clone and Install Dependencies**

```bash
npm install
```

2. **Set Up Environment Variables**

```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

3. **Compile Contracts**

```bash
npm run compile
```

4. **Run Tests**

## Usage Example

```javascript
// Join the lottery
await lottery.enterLottery({ value: ethers.parseEther("0.01") });

// Check current players
const playerCount = await lottery.getPlayerCount();
const players = await lottery.getPlayers();

// View lottery information
const [lotteryId, playerCount, prizePool, currentPlayers] =
  await lottery.getLotteryInfo();
```

## Gas Optimization

- Custom errors instead of require statements
- Efficient storage patterns
- Optimized loops (while instead of for)
- OpenZeppelin's gas-optimized contracts

## Security Considerations

- Reentrancy protection on all external calls
- Input validation for all functions
- Secure pseudo-random number generation
- Prevention of duplicate entries
- Automatic contract state management

## Events

- `PlayerJoined(address indexed player, uint256 indexed lotteryId)`
- `WinnerSelected(address indexed winner, uint256 prizeAmount, uint256 indexed lotteryId)`
- `LotteryReset(uint256 indexed newLotteryId)`

## Deployment

### Using Hardhat Ignition (Recommended)

```bash
# Deploy to local network
npm run deploy-ignition

# Deploy to Lisk Sepolia
npm run deploy-ignition-lisk
```

### Manual Deployment

```bash
# Deploy to Lisk Sepolia
npm run deploy-lisk
```

### Verification

```bash
npx hardhat verify --network lisk CONTRACT_ADDRESS
```

## Deployed Contract

### Lisk Sepolia Testnet

- **Contract Address**: `0x9D4aAB7E06564cD7F45f4F25eAFe09979782d064`
- **Network**: Lisk Sepolia (Chain ID: 4202)
- **Explorer**: [View on Blockscout](https://sepolia-blockscout.lisk.com/address/0x9D4aAB7E06564cD7F45f4F25eAFe09979782d064#code)
- **Verification Status**: ✅ Verified

## License

MIT License

## Development Team

Developed by George Chisom for Web3bridge Cohort XIII

contract address 0x9D4aAB7E06564cD7F45f4F25eAFe09979782d064

---

**Note**: This contract is for educational purposes. Always conduct thorough testing and audits before deploying to mainnet.
