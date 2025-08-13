# Token-Gated DAO with ERC-7432: Non-Fungible Token Roles

A sophisticated decentralized autonomous organization (DAO) implementation that leverages ERC-7432 for role-based governance through NFTs. Instead of simple NFT ownership checks, this DAO validates specific roles assigned to NFTs to determine member permissions and voting rights.

## 🎯 Overview

This project implements a governance system where participation is gated by roles attached to NFTs using the ERC-7432 standard. Users can hold various roles that grant different permissions within the DAO ecosystem.

### Key Features

- **Role-Based Governance**: Uses ERC-7432 to assign specific roles to NFTs
- **Granular Permissions**: Different roles provide different levels of access
- **Time-Bounded Roles**: Support for role expiration
- **Revocable Roles**: Ability to revoke certain roles when needed
- **Multi-NFT Voting Power**: Voting power scales with number of NFTs with voting roles
- **Complete Proposal Lifecycle**: From creation to execution
- **Treasury Management**: Built-in treasury with admin-controlled withdrawals

## 🏗️ Architecture

### Contracts

1. **IERC7432.sol** - Interface defining the ERC-7432 standard for NFT roles
2. **RoleBasedNFT.sol** - NFT contract implementing ERC-7432 with predefined DAO roles
3. **TokenGatedDAO.sol** - Main DAO contract with role-based governance logic

### Role Types

- **DAO_MEMBER_ROLE**: Basic membership in the DAO
- **DAO_ADMIN_ROLE**: Administrative privileges (proposal execution, config updates)
- **PROPOSAL_CREATOR_ROLE**: Permission to create new proposals
- **VOTER_ROLE**: Permission to vote on proposals

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- Git

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node  # In another terminal
npx hardhat run scripts/deploy.ts --network localhost
```

## 📋 Contract Details

### RoleBasedNFT

An ERC-721 contract that implements ERC-7432 for role management:

- **Minting**: Only contract owner can mint new NFTs
- **Role Assignment**: NFT owners or contract owner can assign roles
- **Role Validation**: Includes expiration and revocation logic
- **Standard Compliance**: Full ERC-721 and ERC-7432 implementation

### TokenGatedDAO

The main DAO governance contract:

- **Proposal System**: Create, vote, and execute proposals
- **Role Validation**: Checks roles across all NFTs for permissions
- **Voting Power**: Calculated based on number of NFTs with VOTER_ROLE
- **Time-Based Voting**: Configurable voting delays and periods
- **Quorum Requirements**: Minimum vote thresholds for proposal success

## 🔧 Usage Examples

### Deploying and Setting Up

```javascript
// Deploy contracts
const roleBasedNFT = await RoleBasedNFT.deploy("DAO Membership NFT", "DAONFT");
const tokenGatedDAO = await TokenGatedDAO.deploy(roleBasedNFT.address);

// Mint NFT and assign roles
await roleBasedNFT.mint(userAddress);
await roleBasedNFT.grantRole(
  await roleBasedNFT.DAO_MEMBER_ROLE(),
  tokenId,
  userAddress,
  0, // No expiration
  true, // Revocable
  "0x" // No additional data
);
```

### Creating and Voting on Proposals

```javascript
// Create a proposal (requires PROPOSAL_CREATOR_ROLE)
await tokenGatedDAO.propose(
  "Funding Proposal",
  "Allocate 1 ETH for development"
);

// Vote on proposal (requires VOTER_ROLE)
await tokenGatedDAO.castVote(
  proposalId,
  1, // Vote choice: 0=Against, 1=For, 2=Abstain
  "I support this proposal"
);

// Execute proposal (requires DAO_ADMIN_ROLE)
await tokenGatedDAO.executeProposal(proposalId);
```

## 🧪 Testing

The project includes comprehensive tests covering:

- Role assignment and validation
- Proposal creation and voting
- Time-based logic (delays, expiration)
- Permission checks
- Integration flows

Run tests with:

```bash
npx hardhat test
```

## 🔐 Security Considerations

- **Role Management**: Carefully control who can grant/revoke roles
- **Expiration Logic**: Implement proper timestamp validation
- **Reentrancy Protection**: Built-in protections for treasury operations
- **Access Control**: Multiple layers of permission checking
- **Proposal Validation**: Comprehensive state checking before execution

## 📊 Governance Parameters

Default configuration (can be updated by admins):

- **Voting Delay**: 1 day (time before voting starts)
- **Voting Period**: 3 days (duration of voting)
- **Proposal Threshold**: 1 (minimum voting power to create proposals)
- **Quorum**: 4 (minimum votes needed for proposal to pass)

## 🏆 Features Comparison

| Feature | Traditional Token Gating | This Implementation |
|---------|-------------------------|-------------------|
| Governance Mechanism | Simple NFT ownership | Role-based permissions |
| Permission Granularity | Binary (own/don't own) | Multiple role types |
| Time-based Access | Not supported | Role expiration supported |
| Revocation | Transfer NFT only | Granular role revocation |
| Voting Power | 1 NFT = 1 vote | Role-based voting power |
| Administrative Control | Limited | Comprehensive admin roles |
