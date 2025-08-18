# Ludo Game 🎲

A decentralized Ludo game built on Ethereum where players stake tokens, roll dice, and compete to reach the finish line first.

## 🎯 Goal
Design and implement a Ludo game where each user has a name, score, and color they represent. Available colors are: RED, GREEN, BLUE, YELLOW.

## ✨ Features
- Maximum of 4 players with unique colors
- Token-based staking system
- Random dice rolling algorithm
- Winner takes all prize pool
- Custom error handling

## 🏗️ Architecture

### Contracts
- **LudoToken** (`0x3592Ade44d9f2403063116c0F8309170cb357C4f`) - ERC20 token for staking
- **LudoGame** (`0x3590Ae931264Ba4992Ff2cdD82c085fC221cAE60`) - Main game logic
- **ErrorCodes** - Centralized custom errors

### Game Flow
1. Players register with unique names and colors
2. Each player stakes tokens (10 LUDO minimum)
3. Game starts when all players have staked
4. Players take turns rolling dice and moving
5. First player to reach position 30 wins the entire prize pool

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Hardhat
- Sepolia testnet ETH

### Installation
```bash
npm install
npm run compile
```

### Testing
```bash
npm run test
```

### Local Simulation
```bash
npx hardhat run scripts/Ludo.s.ts
```

## 🌐 On-Chain Interaction

### Contract Addresses (Sepolia)
- **LudoToken**: [0x3592Ade44d9f2403063116c0F8309170cb357C4f](https://sepolia.etherscan.io/address/0x3592Ade44d9f2403063116c0F8309170cb357C4f)
- **LudoGame**: [0x3590Ae931264Ba4992Ff2cdD82c085fC221cAE60](https://sepolia.etherscan.io/address/0x3590Ae931264Ba4992Ff2cdD82c085fC221cAE60)

### Step-by-Step Walkthrough

#### 1. Get LUDO Tokens
Only the token owner can mint. If you're not the owner, ask them to mint tokens to your address:
```
Token Contract → Write Contract → mint(to: YOUR_ADDRESS, value: 100000000000000000000)
```
This gives you 100 LUDO tokens.

#### 2. Approve Game Contract
Allow the game to spend your stake:
```
Token Contract → Write Contract → approve(spender: 0x3590Ae931264Ba4992Ff2cdD82c085fC221cAE60, value: 10000000000000000000)
```
This approves 10 LUDO for staking.

#### 3. Register as Player
Choose a unique color (0=RED, 1=GREEN, 2=BLUE, 3=YELLOW):
```
Game Contract → Write Contract → register(name: "YourName", color: 0)
```

#### 4. Stake Tokens
Lock in your stake:
```
Game Contract → Write Contract → stake()
```

#### 5. Start Game
Once 2-4 players have registered and staked:
```
Game Contract → Write Contract → startGame()
```

#### 6. Play the Game
Roll dice and move:
```
Game Contract → Write Contract → rollDice()
```

### 🎲 Game Rules
- **Colors**: Each player must have a unique color
- **Staking**: All players must stake before the game can start
- **Movement**: Dice roll (1-6) determines movement distance
- **Winning**: First player to reach position 30 wins all staked tokens
- **Maximum Players**: 4 players maximum

### ⚠️ Common Errors
- `AlreadyRegistered`: Player already registered
- `ColorAlreadyTaken`: Color already in use
- `MaxPlayersReached`: Maximum 4 players allowed
- `AlreadyStaked`: Player already staked
- `NeedMorePlayers`: Minimum 2 players required
- `AllPlayersMustStake`: All registered players must stake
- `GameNotStarted`: Game hasn't started yet

## 🔧 Development

### Scripts
```bash
npm run compile          # Compile contracts
npm run test            # Run tests
npm run deploy:sepolia  # Deploy to Sepolia
npm run deploy:game     # Deploy game only
```

## 📝 License
UNLICENSED
