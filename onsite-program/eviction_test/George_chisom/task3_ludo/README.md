# Ludo Game Smart Contract

A blockchain-based Ludo game implementation with token staking and winner-takes-all mechanics.

## Features

- Player registration with unique names and colors (RED, GREEN, BLUE, YELLOW)
- Maximum 4 players per game
- Token staking mechanism where winner takes all
- Dice rolling algorithm with random number generation
- Move calculation based on dice rolls
- Complete game state management
- Deployed and verified on Lisk Sepolia testnet

## Contracts

### LudoToken.sol

- ERC20-like token for game staking
- Standard transfer, approve, and transferFrom functions
- Minting capability for game rewards

### LudoGame.sol

- Main game logic contract
- Player registration and color management
- Token staking and prize pool management
- Dice rolling and move mechanics
- Game state tracking and winner determination

## Game Rules

1. Players must register with a unique name and color
2. Each player stakes tokens to join the game
3. Game starts when all registered players have staked
4. Players take turns rolling dice and moving
5. First player to reach position 51 wins all staked tokens
6. Dice values range from 1 to 6
7. Player positions are tracked on a 52-space board

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
LISK_API_KEY=abc
```

## Testing

Run comprehensive tests:

```bash
npm run test
```

## Deployment

### Local Development

```bash
npm run compile
npm run deploy
```

### Lisk Sepolia Testnet

```bash
npm run deploy:lisk
```

## Verification

After deployment, verify contracts:

```bash
TOKEN_ADDRESS= "0x3b7605bde7bCa53a9588746c5F35eE20398655ec" GAME_ADDRESS="0xfA0815A461b6a6b42a0354c735F70C404984a8f2"
```
