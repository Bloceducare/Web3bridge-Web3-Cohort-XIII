# Ludo Game Smart Contract

A decentralized Ludo game built with Solidity and Hardhat, featuring player registration, token staking, and dice-based gameplay.

## Features

### Player System
- Registration: Players register with a name and choose from 4 colors (RED, GREEN, BLUE, YELLOW)
- Maximum Players: Limited to 4 players per game
- Unique Colors: Each player must choose a different color

### Game Token (LGT)
- ERC-20 Compatible: Custom token for game interactions
- Staking Mechanism: Players stake 10 tokens to join a game
- Winner Takes All: Winner receives all staked tokens

### Gameplay
- Dice Rolling: Pseudo-random dice generation (1-6)
- Turn-Based: Players take turns in order
- Position Tracking: Each player's position on the board (0-51)
- Scoring System: Points based on dice rolls and completion

### Game States
- WAITING: Accepting player registrations and stakes
- ACTIVE: Game in progress
- FINISHED: Game completed with winner

## Contract Addresses

Lisk Sepolia Testnet:
- GameToken (LGT): 0x2ba247A1B6233E8868D04F2eDD8247a8DeBF4cc9
- LudoGame: 0x23275b85Ac101f06aEdB0D13F9e0f3F515430cC2

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
```

## Usage

### 1. Register Players
```solidity
ludoGame.registerPlayer("Alice", 0);
ludoGame.registerPlayer("Bob", 1);
```

### 2. Approve and Stake Tokens
```solidity
gameToken.approve(ludoGameAddress, stakeAmount);
ludoGame.stakeTokens();
```

### 3. Play the Game
```solidity
uint256 diceValue = ludoGame.rollDice();
```

### 4. View Game Information
```solidity
(string memory name, uint8 color, uint256 score, uint256 position, bool isRegistered, bool hasStaked)
    = ludoGame.getPlayerInfo(playerAddress);

(uint8 state, uint256 playersCount, uint256 stakedAmount, address currentPlayer, address winner)
    = ludoGame.getGameInfo();
```

## Game Rules

1. **Registration**: Players must register before playing
2. **Staking**: All players must stake 10 tokens before game starts
3. **Turn Order**: Players take turns rolling dice
4. **Movement**: Player position increases by dice value
5. **Winning**: First player to reach position 51 wins all tokens
6. **Reset**: Game can be reset after completion

## Testing

The project includes comprehensive tests covering:

- Player registration validation
- Token staking mechanics
- Game state transitions
- Dice rolling and movement
- Winner determination
- Access controls

Run tests with:
```bash
npm run test
```

## Deployment

### Prerequisites
- Node.js and npm installed
- Private key with Lisk Sepolia ETH for deployment
- Environment variable PRIVATE_KEY set

### Deploy to Lisk Sepolia

1. Set your private key:
```bash
PRIVATE_KEY=your_private_key_here
```

2. Deploy contracts:
```bash
npm run deploy:lisk
```

3. Verify contracts:
```bash
npm run verify [CONTRACT_ADDRESS]
```

## Contract Architecture

### GameToken.sol
- ERC-20 compatible token
- Minting functionality for testing
- Standard transfer and approval methods

### LudoGame.sol
- Main game logic
- Player registration and management
- Dice rolling algorithm
- Token staking and prize distribution
- Game state management

## Security Features

- Access Control: Only registered players can participate
- Turn Validation: Only current player can roll dice
- State Management: Proper game state transitions
- Token Safety: Secure token transfers and approvals

## Gas Optimization

- Efficient storage patterns
- Minimal external calls
- Optimized loops and iterations
- Event-driven architecture

## License

MIT License
