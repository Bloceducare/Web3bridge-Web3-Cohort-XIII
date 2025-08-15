# LootBox Smart Contract System

A comprehensive on-chain mystery box (loot box) system built with Solidity and Foundry, featuring Chainlink VRF for provably fair randomness and support for multiple reward types including ERC20, ERC721, and ERC1155 tokens.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Gas Optimization](#gas-optimization)
- [License](#license)

## Overview

The LootBox system allows users to purchase mystery boxes containing various digital rewards with different rarity levels. The system uses Chainlink VRF (Verifiable Random Function) to ensure provably fair and tamper-proof randomness in reward distribution.

### Key Components

- **LootBox Contract**: Main contract handling purchases, VRF integration, and reward distribution
- **Weighted Random Library**: Gas-optimized library for weighted random selection
- **Mock Contracts**: ERC20, ERC721, ERC1155, and VRF Coordinator mocks for testing
- **Deployment Scripts**: Automated deployment for multiple networks
- **Comprehensive Test Suite**: Extensive testing covering all functionality and edge cases

## Features

### Core Functionality
- Purchase mystery boxes with ETH payments
- Chainlink VRF integration for secure randomness
- Support for multiple reward types (ERC20, ERC721, ERC1155)
- Weighted probability system with five rarity levels
- Comprehensive event logging for all interactions
- Owner controls for reward management and system configuration

### Rarity System
- **COMMON**: 50% probability (5000/10000)
- **UNCOMMON**: 30% probability (3000/10000)
- **RARE**: 15% probability (1500/10000)
- **EPIC**: 4% probability (400/10000)
- **LEGENDARY**: 1% probability (100/10000)

### Security Features
- OpenZeppelin security patterns (Ownable, ReentrancyGuard, Pausable)
- Comprehensive input validation and error handling
- Emergency withdrawal functions
- Access control for administrative functions

## Architecture

### Contract Structure
```
src/
├── LootBox.sol                 # Main loot box contract
├── interfaces/
│   └── ILootBox.sol           # Interface definitions
├── libraries/
│   └── WeightedRandom.sol     # Weighted random selection library
└── mocks/                     # Mock contracts for testing
    ├── MockERC20.sol
    ├── MockERC721.sol
    ├── MockERC1155.sol
    └── MockVRFCoordinator.sol
```

### Workflow
1. **Setup**: Owner adds rewards with specified rarities
2. **Purchase**: User pays ETH to purchase a loot box
3. **VRF Request**: System requests randomness from Chainlink VRF
4. **Fulfillment**: VRF callback triggers reward selection and distribution
5. **Distribution**: Selected reward is transferred to the user

## Smart Contracts

### LootBox.sol
The main contract implementing the loot box functionality with the following key features:
- VRF integration for secure randomness
- Weighted probability system for fair reward distribution
- Support for multiple token standards
- Comprehensive access controls and security measures

### WeightedRandom.sol
A gas-optimized library for weighted random selection featuring:
- Binary search algorithm for O(log n) complexity
- Cumulative weight preparation for efficient multiple selections
- Probability calculation utilities
- Input validation and error handling

### Interface Definitions
Comprehensive interfaces defining all contract interactions, events, and data structures for easy integration and testing.

## Installation

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (optional, for additional tooling)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd allan-lootbox-task

# Install dependencies
forge install

# Build contracts
forge build
```

### Environment Configuration
Create a `.env` file in the project root:
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id
POLYGON_RPC_URL=https://polygon-rpc.com

# API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## Usage

### Basic Commands

#### Build
```bash
forge build
```

#### Test
```bash
forge test
```

#### Format Code
```bash
forge fmt
```

#### Gas Snapshots
```bash
forge snapshot
```

### Local Development

#### Start Local Node
```bash
anvil
```

#### Deploy to Local Network
```bash
forge script script/DeployLootBox.s.sol:DeployMocks --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

### Interacting with Contracts

#### Purchase a Loot Box
```bash
cast send <LOOTBOX_ADDRESS> "purchaseLootBox()" --value 0.1ether --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```

#### Check Box Price
```bash
cast call <LOOTBOX_ADDRESS> "getBoxPrice()" --rpc-url <RPC_URL>
```

#### Get Total Rewards
```bash
cast call <LOOTBOX_ADDRESS> "getTotalRewards()" --rpc-url <RPC_URL>
```

## Testing

The project includes a comprehensive test suite covering:

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: Complete workflow testing
- **Edge Case Tests**: Boundary conditions and error scenarios
- **Access Control Tests**: Permission and security testing
- **Gas Optimization Tests**: Performance verification

### Running Tests
```bash
# Run all tests
forge test

# Run tests with verbosity
forge test -vv

# Run specific test
forge test --match-test testPurchaseLootBox

# Run tests with gas reporting
forge test --gas-report

# Generate coverage report
forge coverage
```

### Test Structure
```
test/
├── LootBox.t.sol              # Main test suite
├── WeightedRandom.t.sol       # Library tests
├── integration/               # Integration tests
└── mocks/                     # Additional mock contracts
```

## Deployment

### Network Configuration

The deployment script supports multiple networks:
- Ethereum Mainnet
- Ethereum Sepolia (Testnet)
- Polygon Mainnet
- Local Development (Anvil)

### Deployment Commands

#### Deploy to Sepolia
```bash
forge script script/DeployLootBox.s.sol:DeployLootBox --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

#### Deploy to Mainnet
```bash
forge script script/DeployLootBox.s.sol:DeployLootBox --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

#### Deploy Mocks for Testing
```bash
forge script script/DeployLootBox.s.sol:DeployMocks --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast
```

### Post-Deployment Setup

After deployment, the contract owner should:

1. **Fund VRF Subscription**: Add LINK tokens to the Chainlink VRF subscription
2. **Add Consumer**: Add the LootBox contract as a consumer to the VRF subscription
3. **Setup Rewards**: Add initial rewards using the `addReward` function
4. **Fund Rewards**: Transfer reward tokens to the contract
5. **Configure Parameters**: Set appropriate box prices and VRF parameters

### Verification

Contracts are automatically verified during deployment when using the `--verify` flag. Manual verification can be done using:

```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --chain-id <CHAIN_ID> --etherscan-api-key <API_KEY>
```

## Security Considerations

### Implemented Security Measures

1. **Reentrancy Protection**: ReentrancyGuard prevents reentrancy attacks
2. **Access Control**: Ownable pattern restricts administrative functions
3. **Pausable**: Emergency pause functionality for critical situations
4. **Input Validation**: Comprehensive validation of all inputs
5. **Safe Token Transfers**: SafeERC20 library for secure token operations
6. **VRF Security**: Chainlink VRF ensures tamper-proof randomness

### Best Practices

1. **Regular Audits**: Conduct security audits before mainnet deployment
2. **Gradual Rollout**: Start with small reward pools and gradually increase
3. **Monitoring**: Implement monitoring for unusual activity
4. **Upgrade Path**: Consider using proxy patterns for upgradability
5. **Emergency Procedures**: Have clear procedures for emergency situations

### Known Limitations

1. **VRF Dependency**: System depends on Chainlink VRF availability
2. **Gas Costs**: VRF callbacks consume significant gas
3. **Centralization**: Owner has significant control over the system
4. **Reward Funding**: Requires manual funding of reward tokens

## Gas Optimization

### Implemented Optimizations

1. **Efficient Data Structures**: Optimized storage layout
2. **Binary Search**: O(log n) weighted random selection
3. **Batch Operations**: Support for batch reward additions
4. **Event Optimization**: Efficient event emission
5. **Library Usage**: Reusable library functions

### Gas Usage Estimates

- **Purchase Loot Box**: ~100,000 gas
- **VRF Fulfillment**: ~200,000 gas
- **Add Reward**: ~50,000 gas
- **Update Reward**: ~30,000 gas

## Technical Implementation Details

### Weighted Random Selection Algorithm

The system uses a gas-optimized weighted random selection algorithm:

1. **Cumulative Weights**: Pre-compute cumulative weights for efficiency
2. **Binary Search**: Use binary search for O(log n) selection complexity
3. **Normalization**: Normalize random values to weight ranges
4. **Validation**: Comprehensive input validation and error handling

### VRF Integration

The Chainlink VRF integration ensures:

1. **Tamper-Proof**: Random numbers cannot be manipulated
2. **Verifiable**: All randomness can be cryptographically verified
3. **Reliable**: Robust callback mechanism with error handling
4. **Configurable**: Adjustable gas limits and confirmation requirements

### Reward Distribution

The reward distribution system supports:

1. **Multiple Token Types**: ERC20, ERC721, and ERC1155 tokens
2. **Flexible Configuration**: Easy addition and modification of rewards
3. **Rarity Management**: Five-tier rarity system with configurable weights
4. **Batch Operations**: Efficient batch reward management

## License

This project is licensed under the MIT License.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for security patterns and libraries
- [Chainlink](https://chain.link/) for VRF integration
- [Foundry](https://book.getfoundry.sh/) for development framework
- [Solidity](https://soliditylang.org/) documentation and community

## Support

For questions, issues, or contributions, please:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Join our community discussions
4. Follow the contribution guidelines

---

**Disclaimer**: This software is provided as-is without any warranties. Use at your own risk. Always conduct thorough testing and audits before deploying to mainnet.