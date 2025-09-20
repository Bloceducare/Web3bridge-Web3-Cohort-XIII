# Lottery Smart Contract

## Overview

This is a simple lottery smart contract where 10 players can join by paying a fixed entry fee. Once 10 players have joined, a winner is randomly selected and receives the entire prize pool.

## Contract Features

- Fixed entry fee set at contract deployment
- Maximum of 10 players per lottery round
- Automatic winner selection when the 10th player joins
- Prevention of duplicate entries in the same round
- Automatic reset after each lottery round

## Testing

The contract includes comprehensive tests that verify:

1. Entry fee validation
2. Participant tracking
3. Prevention of duplicate entries
4. Winner selection logic
5. Prize distribution
6. Lottery reset functionality
7. Edge case handling

## How to Run Tests

```shell
npm test
REPORT_GAS=true npm test
```

## Development Environment

- Solidity: 0.8.28
- Testing Framework: Hardhat with Chai assertions
- Network: Configurable for local development and Lisk Sepolia testnet

## contract address: 0xd305C380eE424584498B719c2c25b696AaC729e5
