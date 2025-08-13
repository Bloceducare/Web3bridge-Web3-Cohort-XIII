# DAO Governance NFT

A token-gated DAO on **Lisk Sepolia testnet** using ERC-721 NFTs with roles for governance.

## Quick Start

### Deploy

```bash
npx hardhat ignition deploy ignition/modules/GovernContract.ts --network liskTestnet
```

### Test

```bash
npx hardhat test
```

## Deployed Contracts

- **InstitutionStaffNFT**: `0xcC36a406684c313f29848c2A0AfBdFc9A3B5503B`
- **TokenGatedDAO**: `0x2E8A552D9fB14678Bdf46Ac68c209A69AFD7Ce7f`

## Core Functions

```javascript
// Mint NFT
await staffNFT.mintStaff(address, 'Admin')

// Grant role
await staffNFT.grantRole(ADMIN_ROLE, tokenId, address, expiration, true, 'data')

// Create proposal
await dao.proposeNewMember(address, role, staffType, description)

// Vote
await dao.castVote(proposalId, 1) // 1=FOR, 0=AGAINST

// Execute
await dao.executeProposal(proposalId)
```

## Member Addition Methods

1. **Direct** - Owner mints NFT + grants role (initial setup)
2. **Governance** - Propose → Vote → Execute (democratic)
3. **Emergency** - Admin bypass for urgent situations
