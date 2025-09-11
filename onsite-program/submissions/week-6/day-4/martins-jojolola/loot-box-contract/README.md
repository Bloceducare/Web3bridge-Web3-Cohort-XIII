# 🎁 LootBox Smart Contract

A comprehensive on-chain mystery box (loot box) smart contract that uses Chainlink VRF for verifiable randomness and supports multiple reward types including ERC20 tokens, ERC721 NFTs, and ERC1155 items.

## ✨ Features

- **🎲 True Randomness**: Uses Chainlink VRF (Verifiable Random Function) for provably fair randomness
- **🏆 Multi-Token Support**: Rewards can be ERC20 tokens, ERC721 NFTs, or ERC1155 items
- **⚖️ Weighted Probability System**: Configure different probabilities for each reward
- **📊 Event Logging**: Comprehensive events for all actions (box purchases, openings, rewards)
- **🛡️ Security**: Built with OpenZeppelin contracts, includes reentrancy protection
- **👑 Admin Controls**: Owner can manage rewards, update prices, and withdraw funds
- **💰 Automatic Refunds**: Excess payments are automatically refunded to users
- **🔒 Emergency Withdrawals**: Owner can recover tokens in emergency situations

## 🏗️ Architecture

### Core Contracts

1. **LootBox.sol**: Main contract handling box purchases, VRF integration, and reward distribution
2. **MockVRFCoordinator.sol**: Mock VRF coordinator for testing
3. **MockERC20.sol**: Test ERC20 token
4. **MockERC721.sol**: Test ERC721 NFT
5. **MockERC1155.sol**: Test ERC1155 multi-token

### Key Components

- **VRF Integration**: Uses Chainlink VRF for secure random number generation
- **Weighted Random Selection**: Algorithm that selects rewards based on configured weights
- **Multi-Token Rewards**: Support for three different token standards
- **Event System**: Comprehensive logging for all contract interactions

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Running the Demo

```bash
# Run the interactive demo
npx hardhat run scripts/demo.ts
```

## 📊 Contract Functions

### User Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `openBox()` | Purchase and open a loot box | `payable` (msg.value >= boxPrice) |
| `getUserBoxes(address user)` | Get all boxes owned by a user | `user`: user address |
| `getBoxReward(uint256 boxId)` | Get the reward for a specific box | `boxId`: box identifier |

### Owner Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `addReward()` | Add a new reward to the pool | `rewardType`, `tokenAddress`, `tokenId`, `amount`, `weight` |
| `updateReward()` | Update reward weight and status | `rewardIndex`, `weight`, `isActive` |
| `setBoxPrice()` | Update the box price | `newPrice`: price in wei |
| `withdrawFunds()` | Withdraw contract ETH balance | None |
| `emergencyWithdraw*()` | Emergency token withdrawal | Various token-specific parameters |

### View Functions

| Function | Description | Return |
|----------|-------------|--------|
| `getRewardsCount()` | Get total number of rewards | `uint256` |
| `getReward(uint256 index)` | Get reward details by index | `Reward struct` |
| `totalWeight()` | Get total probability weight | `uint256` |
| `totalBoxes()` | Get total boxes created | `uint256` |
| `boxesSold()` | Get total boxes sold | `uint256` |
| `boxPrice()` | Get current box price | `uint256` |

## 🎯 Usage Example

```typescript
import { ethers } from "hardhat";

// Deploy LootBox contract
const lootBox = await LootBoxFactory.deploy(
  subscriptionId,    // Chainlink VRF subscription ID
  vrfCoordinator,    // VRF Coordinator address
  keyHash,          // VRF Key Hash
  boxPrice          // Price per box in wei
);

// Add ERC20 reward (60% chance)
await lootBox.addReward(
  0,                              // RewardType.ERC20
  tokenAddress,                   // ERC20 token address
  0,                             // tokenId (not used for ERC20)
  ethers.parseEther("10"),       // 10 tokens
  600                            // 60% chance (out of total weight)
);

// Add ERC721 reward (10% chance)
await lootBox.addReward(
  1,                              // RewardType.ERC721
  nftAddress,                     // NFT contract address
  tokenId,                        // Specific NFT token ID
  1,                             // amount (always 1 for ERC721)
  100                            // 10% chance
);

// User opens a box
await lootBox.connect(user).openBox({ 
  value: ethers.parseEther("0.1") 
});
```

## 🧪 Testing

The project includes comprehensive tests covering:

- ✅ Contract deployment
- ✅ Reward management (add, update, deactivate)
- ✅ Box opening mechanics
- ✅ VRF integration and fulfillment
- ✅ Weighted random selection
- ✅ Administrative functions
- ✅ Security features (access control, reentrancy protection)
- ✅ Edge cases and error handling

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
npx hardhat test --gas-report

# Run coverage analysis
npx hardhat coverage
```

## 📈 Gas Optimization

The contract is optimized for gas efficiency:

- **Batch Operations**: Efficient batch minting for setup
- **Storage Optimization**: Packed structs and minimal storage reads
- **Event-Driven**: Uses events instead of storing unnecessary data
- **Optimized Loops**: Efficient random selection algorithm

### Gas Costs (Approximate)

| Operation | Gas Cost |
|-----------|----------|
| Deploy LootBox | ~1,885,000 |
| Add Reward | ~150,000 |
| Open Box | ~155,000 |
| Fulfill VRF | ~185,000 |

## 🔒 Security Features

- **OpenZeppelin Integration**: Uses battle-tested security patterns
- **Reentrancy Protection**: `nonReentrant` modifier on critical functions
- **Access Control**: Owner-only functions for administrative operations
- **Input Validation**: Comprehensive parameter validation
- **Safe Token Transfers**: Uses `SafeERC20` for secure token operations
- **Overflow Protection**: Built-in overflow protection with Solidity 0.8.24

## 🌐 Chainlink VRF Integration

The contract uses Chainlink VRF for verifiable randomness:

1. **Request**: User opens box, contract requests random number
2. **Wait**: Chainlink VRF processes the request
3. **Fulfill**: VRF coordinator calls back with random number
4. **Distribute**: Contract uses random number to select and distribute reward

### VRF Configuration

```solidity
constructor(
    uint64 subscriptionId,     // Your VRF subscription ID
    address vrfCoordinator,    // VRF Coordinator address
    bytes32 keyHash,          // Gas lane key hash
    uint256 boxPrice          // Price per box
)
```

## 🚀 Deployment

### Local Development

```bash
# Deploy and run demo
npx hardhat run scripts/demo.ts

# Or deploy separately
npx hardhat run scripts/deploy.ts
```

## 📋 Contract Events

### User Events
- `BoxPurchased(buyer, boxId, requestId)`: Box purchased, VRF requested
- `BoxOpened(buyer, boxId, rewardIndex, rewardType, tokenAddress, tokenId, amount)`: Box opened and reward distributed

### Admin Events
- `RewardAdded(rewardIndex, rewardType, tokenAddress, tokenId, amount, weight)`: New reward added
- `RewardUpdated(rewardIndex, weight, isActive)`: Reward updated
- `BoxPriceUpdated(newPrice)`: Box price changed
- `FundsWithdrawn(owner, amount)`: Contract funds withdrawn

## ⚠️ Disclaimer

This contract is for educational and testing purposes. Before using in production:

1. Conduct thorough security audits
2. Test extensively on testnets
3. Ensure proper Chainlink VRF subscription setup
4. Consider gas optimization for your specific use case
5. Implement proper access controls for your deployment scenario

---

**Built with ❤️ for the Web3 community**
