# Ludo Game Smart Contract

## Deployed Addresses

LudoGameModule#GameToken - 0x5EE4B3D20E701E8d0bfcbaA2B99eC5cfc6Bf435c
LudoGameModule#LudoGame - 0x0d83eE345B43733d86aE99aD0bAfbbf680c320A7

This project implements a simple Ludo game on the blockchain with the following features:

## Features

### 🎮 Game Mechanics

- **Player Registration**: Each player has a name, score, and color (RED, BLUE, GREEN, YELLOW)
- **Maximum 4 Players**: Each game supports up to 4 players
- **Token Staking**: Players must stake 10 LGT tokens to join a game
- **Winner Takes All**: The winner receives all staked tokens
- **Dice Rolling**: Random dice generation (1-6) for player movement
- **Position Tracking**: Simple position system (0-100, winner reaches 100)

### 🪙 Token System

- **Game Token (LGT)**: ERC20-like token for staking
- **Minting**: Tokens can be minted for testing
- **Transfer**: Standard token transfer functionality

## Contracts

### 1. GameToken (Lock.sol)

A simple ERC20-like token contract with:

- Name: "Ludo Game Token"
- Symbol: "LGT"
- Decimals: 18
- Minting capability for testing

### 2. LudoGame (LudoGame.sol)

Main game contract with:

- Game creation and management
- Player registration with color selection
- Token staking mechanism
- Dice rolling algorithm
- Turn-based gameplay
- Winner determination and prize distribution

## How to Play

1. **Create a Game**

   ```solidity
   uint256 gameId = ludoGame.createGame();
   ```

2. **Register Players**

   ```solidity
   ludoGame.registerPlayer(gameId, "PlayerName", Color.RED);
   ```

3. **Stake Tokens**

   ```solidity
   gameToken.approve(ludoGameAddress, stakeAmount);
   ludoGame.stakeTokens(gameId);
   ```

4. **Play the Game**
   ```solidity
   uint8 diceValue = ludoGame.rollDice(gameId);
   ```

## Game Rules

- Minimum 2 players required to start
- Players take turns rolling dice
- Each dice roll moves the player forward by 1-6 positions
- First player to reach position 100 wins
- Winner receives all staked tokens
- Players are automatically removed from game mapping after game ends

## Setup Instructions

### Prerequisites

- Node.js v18.19+ or v20.6+ (current version v18.18.0 needs upgrade)
- npm or yarn

### Installation

```shell
npm install
```

### Set Module Type

```shell
npm pkg set type="module"
```

### Compile Contracts

```shell
npx hardhat compile
```

### Run Tests

```shell
npx hardhat test
```

### Deploy Contracts

```shell
npx hardhat ignition deploy ./ignition/modules/LudoGame.ts
```

## Contract Functions

### GameToken Functions

- `transfer(to, amount)`: Transfer tokens
- `approve(spender, amount)`: Approve token spending
- `mint(to, amount)`: Mint new tokens (for testing)

### LudoGame Functions

- `createGame()`: Create a new game
- `registerPlayer(gameId, name, color)`: Register for a game
- `stakeTokens(gameId)`: Stake tokens to join game
- `rollDice(gameId)`: Roll dice and move (only on your turn)
- `getGameInfo(gameId)`: Get game details
- `getPlayerInfo(gameId, playerIndex)`: Get player details
- `getCurrentGame(playerAddress)`: Get player's current game

## Events

- `PlayerRegistered`: When a player joins a game
- `GameStarted`: When all players have staked and game begins
- `DiceRolled`: When a player rolls the dice
- `PlayerMoved`: When a player moves to a new position
- `GameEnded`: When a game is completed

## Testing

The project includes comprehensive tests covering:

- Token functionality
- Game creation and registration
- Staking mechanism
- Dice rolling and movement
- Turn management
- Win conditions

## Security Notes

⚠️ **Important**: This is a beginner-friendly implementation. For production use, consider:

- Using Chainlink VRF for secure randomness instead of block-based randomness
- Adding reentrancy guards
- Implementing proper access controls
- Adding pause functionality
- Gas optimization

## Troubleshooting

### Node.js Version Error

If you see "Node.js version not supported", upgrade to Node.js v18.19+ or v20.6+:

```shell
# Using nvm
nvm install 20
nvm use 20
```

### Module Type Error

If you see "Hardhat only supports ESM projects":

```shell
npm pkg set type="module"
```
