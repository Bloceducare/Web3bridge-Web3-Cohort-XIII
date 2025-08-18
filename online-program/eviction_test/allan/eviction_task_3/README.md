### Ludo Game (Eviction Task 3)

Question 3*
Ludo Game
Design and implement a ludo game where each user has a name, score and and color 
they represent: Available colors are: RED, GREEN, BLUE, YELLOW.
Each user must be registered before they can play and you can have a maximum of 
four players.
Create a dice rolling algorithm to generate a random number for the dice, and 
make sure you implement it for the dice.
Each move must be calculated by the dice roll and properly calculated.
You have to create a token for interaction.
Each user must stake a token when you are trying to start the game and the winner 
takes all.
Test with hardhat
Deploy and verify your contract

This project implements a token-backed Ludo-like dice game with player registration, staking, turn-based play, and winner-takes-all payout, built with Hardhat and verified on Lisk Sepolia.

### What I built
- **ERC20 token (`LudoToken`)**: Standard ERC20 used for staking. Full initial supply is minted to the deployer.
- **Game contract (`LudoGame`)**:
  - Players register with a unique color among {RED, GREEN, BLUE, YELLOW} and a name (max 4 players).
  - The game starts when there are at least 2 players and each stakes the same amount of the ERC20 token via `transferFrom`.
  - Players take turns to `playTurn()`, which rolls a dice (1–6) and increases their score.
  - First to reach or exceed `winningScore` wins and receives the entire pot. The game then finishes.

### Approach
- Modeled player state (`name`, `score`, `color`, `addr`) and game state (`Registering`, `Started`, `Finished`).
- Enforced color uniqueness and a hard cap of 4 players.
- Collected equal stakes from all players at game start using ERC20 allowances, accumulating a `pot`.
- Implemented dice rolling using a pseudo-random hash over recent chain data and a contract nonce; tests assert bounds instead of exact values.
- Emitted clear events for registration, game start, dice rolls, and game finish; used custom errors for precise reverts.

### Contracts
- `contracts/LudoToken.sol`: Minimal ERC20 from OpenZeppelin.
- `contracts/LudoGame.sol`: Game logic using `IERC20` for staking and payouts.

### Network, addresses, and verification
- **Network**: Lisk Sepolia (`chainId: 4202`)
- **Deployer**: `0x395358d1236D01de9193b1F3AEB61A1ACb2Af2b9`
- **LudoToken**: `0xeCABC86813d204746Ad43d6cAE7f06dD4e7cCF1f`
  - Verified: https://sepolia-blockscout.lisk.com/address/0xeCABC86813d204746Ad43d6cAE7f06dD4e7cCF1f#code
- **LudoGame**: `0xe1538AB52380030096365C147aF73aa0B22E7125`
  - Verified: https://sepolia-blockscout.lisk.com/address/0xe1538AB52380030096365C147aF73aa0B22E7125#code

### Tests conducted (and passed)
- Player registration:
  - Registers players with unique colors up to 4.
  - Reverts on duplicate color.
  - Reverts on duplicate registration by same address.
  - Reverts when attempting to exceed 4 players.
- Game start:
  - Requires at least 2 players.
  - Collects equal stakes via `transferFrom`, sets `stakeAmount`, `pot`, `currentTurnIndex`, and emits `GameStarted`.
- Gameplay:
  - Enforces correct turn order; reverts when a non-turn player calls `playTurn()`.
  - `DiceRolled` event emitted; dice value asserted to be within 1–6.
- Winning & payout:
  - When a player's score reaches `winningScore`, `winner` is set, game finishes, and the full `pot` is paid to the winner.
- "Game not started" guard:
  - Reverts `playTurn()` when game is not started.

All tests passed locally using Hardhat + ethers v6.

### How to run locally
- Install dependencies:
  - `npm i`
- Compile and test:
  - `npx hardhat compile`
  - `npm test`



- Deploy to Lisk Sepolia:
  - `npx hardhat run scripts/deploy.js --network lisk-sepolia`

