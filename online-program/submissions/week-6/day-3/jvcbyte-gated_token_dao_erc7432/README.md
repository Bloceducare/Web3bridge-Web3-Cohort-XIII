# Token-Gated DAO with ERC-7432

A decentralized autonomous organization (DAO) where governance participation is gated by roles attached to NFTs via the ERC-7432 standard. This implementation allows for fine-grained access control based on NFT roles rather than just ownership.

## Table of Contents

- [Features](#features)
- [Smart Contracts](#smart-contracts)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage](#usage)
- [Architecture](#architecture)
- [License](#license)

## Features

- **Role-Based Access Control**: Control DAO participation based on NFT roles
- **ERC-7432 Integration**: Implements the Non-Fungible Token Roles standard
- **Flexible Governance**: Configurable voting power and proposal requirements
- **Upgradeable Contracts**: Built with upgradeability in mind using OpenZeppelin Upgrades
- **Gas Optimization**: Includes gas optimizations for cost-effective operations

## Smart Contracts

### 1. ERC7432.sol
Implements the ERC-7432 standard for managing roles on NFTs. This contract handles the assignment and verification of roles for NFTs.

### 2. DAOToken.sol
An ERC-721 token contract that represents membership in the DAO. Each token can be assigned specific roles that grant different permissions within the DAO.

### 3. DAORoles.sol
The main DAO contract that manages proposals, voting, and access control based on NFT roles. It integrates with ERC7432 for role verification.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Hardhat
- An Ethereum wallet (for deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gated-token-dao-erc7432
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PRIVATE_KEY=your_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

## Testing

Run the test suite with:

```bash
npx hardhat test
```

For gas usage reports:

```bash
REPORT_GAS=true npx hardhat test
```

## Deployment

1. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

2. Deploy to a local network:
   ```bash
   npx hardhat node
   npx hardhat run --network localhost scripts/deploy.ts
   ```

3. Deploy to a testnet or mainnet:
   ```bash
   npx hardhat run --network <network_name> scripts/deploy.ts
   ```

## Usage

### 1. Minting DAO Tokens
```typescript
const tx = await daoToken.mint(userAddress, tokenURI);
await tx.wait();
```

### 2. Granting Roles to NFTs
```typescript
const role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VOTER_ROLE"));
const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

await erc7432.grantRole(
  role,
  daoToken.address,
  tokenId,
  userAddress,
  expirationTime
);
```

### 3. Creating a Proposal
```typescript
await daoRoles.createProposal("Proposal Title", 86400); // 1 day voting period
```

### 4. Voting on a Proposal
```typescript
await daoRoles.vote(proposalId, true); // true = yes, false = no
```

### 5. Executing a Proposal
```typescript
await daoRoles.executeProposal(proposalId);
```

## Architecture

```
gated-token-dao-erc7432/
├── contracts/                  # Smart contracts
│   ├── interfaces/             # Contract interfaces
│   │   └── IERC7432.sol        # ERC-7432 interface
│   ├── DAOToken.sol           # ERC-721 token with role support
│   ├── ERC7432.sol            # ERC-7432 implementation
│   └── DAORoles.sol           # Main DAO contract
├── scripts/                   # Deployment scripts
│   └── deploy.ts              # Deployment script
├── test/                      # Test files
│   └── DAOTest.ts             # Test suite
├── hardhat.config.ts          # Hardhat configuration
└── README.md                  # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
