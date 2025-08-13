# ERC-7432 Token-Gated DAO

A decentralized autonomous organization (DAO) where governance participation is gated by roles attached to NFTs via ERC-7432: Non-Fungible Token Roles.

## Overview

This project implements a complete DAO governance system with three main contracts:

- **RolesRegistry**: Manages ERC-7432 roles for NFTs
- **DAONFT**: Governance NFT contract with ERC-721 compliance
- **DAO**: Core governance contract with proposal creation, voting, and execution

## Key Features

- **Token-Gated Access**: Only NFT owners with specific roles can participate
- **Role-Based Permissions**: PROPOSER_ROLE, VOTER_ROLE, EXECUTOR_ROLE
- **Voter Snapshots**: Captures eligible voters at proposal creation
- **Time-Based Voting**: Configurable voting periods
- **Simple Majority**: Proposals pass with more YES than NO votes

## Quick Start

### 1. Install Dependencies
```bash
forge install
```

### 2. Build Contracts
```bash
forge build
```

### 3. Run Tests
```bash
forge test
```

### 4. Start Local Network
```bash
anvil --port 8545
```

### 5. Deploy Contracts
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --private-key --broadcast
```

### 6. Run Simulation
```bash
forge script script/Simulation.s.sol:SimulationScript --rpc-url http://127.0.0.1:8545
```

## Scripts

- **`Deploy.s.sol`**: Deploys all contracts and sets up initial roles
- **`Simulation.s.sol`**: Comprehensive simulation of all DAO functionality
- **`Verify.s.sol`**: Contract verification helper

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RolesRegistry │    │     DAONFT      │    │      DAO        │
│                 │    │                 │    │                 │
│ • Role storage  │◄───┤ • NFT minting   │◄───┤ • Proposals    │
│ • Role grants   │    │ • Ownership     │    │ • Voting       │
│ • Role checks   │    │ • Transfers     │    │ • Execution    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Usage

### Creating a Proposal
```solidity
dao.createProposal("Description", votingPeriod, tokenId);
```

### Voting
```solidity
dao.vote(proposalId, support, tokenId);
```

### Executing a Proposal
```solidity
dao.executeProposal(proposalId, tokenId);
```

## Testing

The simulation script demonstrates:
- NFT minting and ownership
- Proposal creation and management
- Voting system with role verification
- Time-based execution
- Security features and edge cases

## License

MIT
