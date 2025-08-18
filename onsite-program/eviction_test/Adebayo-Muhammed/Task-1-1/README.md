# Lottery Smart Contract

A simple decentralized lottery smart contract built with Solidity and Hardhat. Players pay exactly 0.01 ETH to enter, and when 10 players join, a winner is automatically selected to receive the entire prize pool.

## 🎯 Features

### Core Functionality
- **Entry Fee**: Players must pay exactly 0.01 ETH to enter
- **Player Limit**: Maximum of 10 players per round
- **Automatic Winner Selection**: Winner is chosen automatically when 10 players join
- **Prize Distribution**: Winner receives the entire prize pool (0.1 ETH)
- **Round System**: Lottery automatically resets for new rounds

### Security Features
- **No Double Entry**: Players cannot enter the same round twice
- **Exact Payment**: Only accepts the exact entry fee (0.01 ETH)
- **Automatic Execution**: Winner selection cannot be manually triggered
- **State Reset**: Complete state cleanup between rounds

### Events
- `PlayerJoined`: Emitted when a player enters the lottery
- `WinnerSelected`: Emitted when a winner is chosen
- `LotteryReset`: Emitted when the lottery resets for a new round

## 📋 Contract Addresses

**Local Hardhat Network**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

**Lisk Sepolia Testnet**: `0x65aC3bA0bA0eB6be9B056A26C5305decB3Eef384`
- 🔗 [View on Lisk Explorer](https://sepolia-blockscout.lisk.com/address/0x65aC3bA0bA0eB6be9B056A26C5305decB3Eef384)
- ✅ **Verified Contract** - Source code is publicly available

## 🚀 Getting Started

### Installation
```shell
npm install
```

### Compile Contract
```shell
npx hardhat compile
```

### Run Tests
```shell
npx hardhat test
```

### Deploy and Interact (Local)
```shell
npx hardhat run scripts/deploy-and-interact.ts
```

### Deploy to Lisk Sepolia
```shell
npx hardhat run scripts/deploy-to-lisk.ts --network lisk-sepolia
```

### Deploy with Ignition
```shell
npx hardhat ignition deploy ignition/modules/Lottery.ts
```

## 🧪 Testing

The project includes comprehensive tests covering all 5 requirements:

1. ✅ **Users can enter only with exact fee** - Tests exact payment validation
2. ✅ **Contract correctly tracks 10 players** - Tests player count tracking
3. ✅ **Only after 10 players, winner is chosen** - Tests automatic winner selection
4. ✅ **Prize pool transferred correctly to winner** - Tests prize distribution
5. ✅ **Lottery resets for next round** - Tests state reset functionality

Run tests with:
```shell
npx hardhat test test/Lottery.test.ts
```

## 📁 Project Structure

```
├── contracts/
│   └── Lottery.sol           # Main lottery contract
├── test/
│   └── Lottery.test.ts       # Comprehensive test suite
├── scripts/
│   ├── deploy-and-interact.ts # Local deployment & interaction
│   └── deploy-to-lisk.ts     # Lisk testnet deployment
├── ignition/modules/
│   └── Lottery.ts           # Ignition deployment module
└── README.md                # This file
```

## 🔧 Contract Functions

### Public Functions
- `enterLottery()`: Allows players to enter by paying the entry fee
- `getPlayers()`: Returns the current list of players
- `getPlayerCount()`: Returns the number of current players
- `getPrizePool()`: Returns the current prize pool amount
- `getCurrentRound()`: Returns the current lottery round number

### View Functions
- `ENTRY_FEE`: Returns the entry fee (0.01 ETH)
- `MAX_PLAYERS`: Returns the maximum players (10)
- `players`: Array of current player addresses
- `hasEntered`: Mapping to check if address has entered current round
- `lotteryRound`: Current round number
- `totalPrizePool`: Current prize pool amount

## 🛡️ Security Considerations

### Implemented Security Measures
1. **Input Validation**: Strict entry fee validation
2. **Access Control**: Automatic winner selection prevents manipulation
3. **State Management**: Proper cleanup between rounds
4. **Reentrancy Protection**: Uses `.transfer()` for safe ETH transfers

### Known Limitations
1. **Pseudo-Random Generation**: Uses block properties for randomness (suitable for learning/testing)
2. **Gas Costs**: Winner selection gas costs are paid by the last player

## 📊 Test Results

```
✔ Should allow entry with exact 0.01 ETH
✔ Should reject entry with insufficient fee
✔ Should reject entry with excessive fee
✔ Should track player count correctly up to 9 players
✔ Should automatically select winner when 10th player joins
✔ Should reset prize pool after winner selection
✔ Should reset and allow new round

7 passing (575ms)
```

## 🎮 How to Use

1. **Deploy the contract** using the provided scripts
2. **Players enter** by calling `enterLottery()` with exactly 0.01 ETH
3. **Winner is selected** automatically when the 10th player joins
4. **Prize is transferred** to the winner immediately
5. **Lottery resets** for the next round

## 🌐 Live Contract Interaction

You can interact with the deployed contract on Lisk Sepolia testnet:
- **Contract Address**: `0x65aC3bA0bA0eB6be9B056A26C5305decB3Eef384`
- **Network**: Lisk Sepolia Testnet (Chain ID: 4202)
- **RPC URL**: `https://rpc.sepolia-api.lisk.com`

### Get Testnet ETH
- 🚰 [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)

## 📄 License

MIT License