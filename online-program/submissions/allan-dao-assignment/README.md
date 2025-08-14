# Token-Gated DAO using ERC-7432: Non-Fungible Token Roles

A decentralized autonomous organization (DAO) that uses ERC-7432 NFT roles for governance participation instead of simple NFT ownership.

## Overview

This project implements a DAO where governance participation (voting, proposals, and execution) is gated by specific roles attached to NFTs via ERC-7432. The system includes:

- **RoleNFT**: ERC-721 contract implementing ERC-7432 for role management
- **TokenGatedDAO**: Main DAO contract with role-based governance

## Features

### Role-Based Access Control
- **VOTER_ROLE**: Can vote on proposals
- **PROPOSER_ROLE**: Can create new proposals  
- **EXECUTOR_ROLE**: Can execute passed proposals

### DAO Functionality
- Create proposals with 7-day voting period
- Vote for/against proposals
- Execute proposals after voting deadline
- Role expiration and revocation support

## Smart Contracts

### RoleNFT.sol
- Implements ERC-721 and ERC-7432
- Manages role assignment to NFT holders
- Supports role expiration and revocation

### TokenGatedDAO.sol
- Main governance contract
- Validates roles before allowing actions
- Manages proposal lifecycle

## Installation & Setup

```bash
npm install
npx hardhat compile
```

## Testing

```bash
npx hardhat test
```

## Deployment

```bash
npx hardhat run scripts/deploy.js --network localhost
```

## Usage Example

1. Deploy contracts
2. Mint NFTs to users
3. Grant appropriate roles to NFT holders
4. Users can now participate in governance based on their roles

## Architecture

The system separates role management from governance logic, allowing flexible permission structures while maintaining security through role validation.