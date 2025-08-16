# 🎁 Loot Box (Mystery Box) Smart Contract

A decentralized loot box system built on Ethereum Sepolia testnet using Chainlink VRF v2.5 for provably fair random number generation.

## 🚀 Live Contract

**Sepolia Contract Address**: [`0x615Ee3Feb9b6E2756f8B50CB9f5427f0c9F901C6`](https://sepolia.etherscan.io/address/0x615Ee3Feb9b6E2756f8B50CB9f5427f0c9F901C6)

**Etherscan**: [https://sepolia.etherscan.io/address/0x615Ee3Feb9b6E2756f8B50CB9f5427f0c9F901C6](https://sepolia.etherscan.io/address/0x615Ee3Feb9b6E2756f8B50CB9f5427f0c9F901C6)

## ✨ Features

- **🎲 Provably Fair Randomness**: Uses Chainlink VRF v2.5 for tamper-proof random number generation
- **💰 Multiple Reward Types**: Supports ERC20, ERC721, and ERC1155 tokens
- **⚖️ Weighted Distribution**: Configurable chance percentages for each reward
- **🔒 Security**: Built-in reentrancy protection and access controls
- **⛽ Gas Optimized**: Efficient contract design with reduced gas costs
- **💎 Cost Effective**: Uses LINK payment for VRF (cheaper than ETH)

## 🏗️ Architecture

### Smart Contracts

- **`LootBox.sol`** - Main loot box contract with VRF integration
- **`TestERC20.sol`** - Test ERC20 token for development
- **`TestERC721.sol`** - Test ERC721 NFT for development  
- **`TestERC1155.sol`** - Test ERC1155 token for development

### VRF Configuration

- **Network**: Ethereum Sepolia Testnet
- **VRF Version**: v2.5

## 🎯 How It Works

1. **User pays a fee** (currently 0.01 ETH) to open a loot box
2. **Contract requests random number** from Chainlink VRF
3. **VRF callback** provides provably fair randomness
4. **Weighted algorithm** selects a reward based on configured chances
5. **Reward is transferred** to the user's wallet

## 🎲 Current Reward Distribution

- **ERC20 Tokens**: 40% chance (10 ETH worth)
- **ERC721 NFT #1**: 30% chance
- **ERC721 NFT #2**: 20% chance  
- **ERC1155 Items**: 10% chance (5 items)

## 🛠️ Development

### Prerequisites

- [Foundry](https://getfoundry.sh/) - Ethereum development toolkit
- Node.js 16+ (for dependencies)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd loot-box-contract

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install
```

### Build & Test

```bash
# Build contracts
forge build

# Run tests
forge test

# Run tests with coverage
forge coverage
```

### Deployment

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export RPC_URL="your_sepolia_rpc_url"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# Deploy to Sepolia
forge script script/DeployLootBoxFullID.s.sol:DeployLootBoxFullID \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## 🔧 Contract Functions

### User Functions

- **`openBox()`** - Open a loot box (payable, requires fee)
- **`getPendingRequest(address player)`** - Check pending VRF requests

### Admin Functions

- **`addERC20Reward(address token, uint256 amount, uint256 quantity, uint256 weight)`** - Add ERC20 rewards
- **`addERC721Reward(address token, uint256 tokenId, uint256 weight)`** - Add ERC721 rewards
- **`addERC1155Reward(address token, uint256 id, uint256 amount, uint256 quantity, uint256 weight)`** - Add ERC1155 rewards
- **`setFee(uint256 newFee)`** - Update loot box fee
- **`withdrawETH(address payable to, uint256 amount)`** - Withdraw ETH from contract
- **`withdrawERC20/721/1155`** - Withdraw tokens from contract

### View Functions

- **`getReward(uint256 index)`** - Get reward details by index
- **`getRewardsCount()`** - Get total number of rewards
- **`feeWei()`** - Get current fee in wei
- **`totalActiveWeight()`** - Get total weight of active rewards

## 🧪 Testing

The project includes comprehensive tests covering:

- ✅ Reward addition and management
- ✅ VRF request handling
- ✅ Box opening functionality
- ✅ Weighted distribution logic
- ✅ Edge cases and error handling

Run tests with:
```bash
forge test -vv
```

## 🔒 Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Control**: Only owner can add rewards and withdraw funds
- **Input Validation**: Comprehensive parameter checking
- **Safe Transfers**: Uses safe transfer functions for tokens
- **VRF Security**: Chainlink VRF ensures randomness cannot be manipulated

## 📊 Gas Optimization

- **Optimized Storage**: Efficient data structures
- **Reduced Callback Gas**: 50,000 gas limit for VRF callbacks
- **LINK Payment**: Uses LINK instead of ETH for VRF (cost-effective)
- **Batch Operations**: Efficient reward management

## 🌐 Networks

- **Sepolia Testnet**: Fully deployed and tested ✅
- **Mainnet**: Ready for deployment (requires VRF subscription setup)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For questions or support:
- Create an issue in this repository
- Check the [Chainlink VRF documentation](https://docs.chain.link/vrf/v2-5/introduction)

---

**Built with ❤️ using Foundry and Chainlink VRF**
