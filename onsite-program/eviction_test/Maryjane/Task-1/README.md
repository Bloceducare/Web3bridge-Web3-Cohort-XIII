# Lottery Smart Contract

A decentralized lottery smart contract built with Solidity and Hardhat.

## Contract Address

Deployed to Lisk Sepolia: `0xF5d46FDE70CF2FC6e7362fc8687ca1139939eFef`

## Features

- Entry fee: 0.01 ETH
- Max players: 10 per round
- Automatic winner selection
- Prize distribution to winner
- Lottery reset after each round

## Usage

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network lisk-sepolia
```

## Contract Functions

- `enterLottery()`: Join lottery with 0.01 ETH
- `getPlayerCount()`: View current players
- `getPlayers()`: View all players
- `getPrizePool()`: View current prize pool
- `getLotteryInfo()`: Get complete lottery status