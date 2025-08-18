# Lottery Smart Contract

A decentralized lottery smart contract built with Solidity and Hardhat, deployed on Lisk Sepolia testnet.

## Contract Features

### Entry Rules
- Users can join the lottery by paying exactly 0.02 ETH
- Multiple players can participate in each round
- Maximum of 10 players per round

### Player Tracking
- Stores all participants' addresses
- Prevents duplicate entries in the same round
- Tracks current round number

### Automatic Winner Selection
- Automatically selects a winner when 10 players have joined
- Winner receives the entire prize pool (0.2 ETH)
- Uses pseudo-random number generation based on block data

### Events
- `PlayerJoined`: Emitted when a player enters the lottery
- `WinnerSelected`: Emitted when a winner is chosen
- `LotteryReset`: Emitted when the lottery resets for a new round

### Security Features
- Prevents anyone from manually calling winner selection
- Ensures no duplicate entries per round
- Automatic lottery reset after each round
- Reentrancy protection through proper state management

## Contract Address:   0x5FbDB2315678afecb367f032d93F642f64180aa3

**Lisk Sepolia Testnet**: 

## Installation and Setup

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy locally
npm run deploy:local

# Deploy to Lisk Sepolia
npm run deploy:lisk

# Run interaction script
npm run interact
```

## Testing

The contract includes comprehensive unit tests covering:

1. **Entry Requirements**
   - Exact fee validation (0.02 ETH)
   - Duplicate entry prevention
   - Maximum player limit

2. **Player Tracking**
   - Correct player count tracking
   - Prize pool accumulation
   - Player address storage

3. **Winner Selection**
   - Automatic selection at 10 players
   - Prize transfer to winner
   - Proper event emission

4. **Lottery Reset**
   - State reset after winner selection
   - New round initialization
   - Player re-entry capability

5. **View Functions**
   - Player list retrieval
   - Current round tracking
   - Prize pool queries

## Usage

### Entering the Lottery

```solidity
// Send exactly 0.02 ETH to enter
lottery.enterLottery{value: 0.02 ether}();
```

### View Functions

```solidity
// Get current players
address[] memory players = lottery.getPlayers();

// Get player count
uint256 count = lottery.getPlayerCount();

// Get prize pool
uint256 prize = lottery.getPrizePool();

// Get current round
uint256 round = lottery.getCurrentRound();
```

## License

MIT License
