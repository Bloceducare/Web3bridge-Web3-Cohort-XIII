# Piggy Bank Factory - Web3bridge Week 6 Assignment

A comprehensive smart contract system implementing a factory pattern for creating and managing multiple piggy bank savings accounts with support for both ETH and ERC20 tokens.

**Author:** Allan Kamau

**Assignment:** Web3bridge Week 6 - Factory Pattern & Multi-Token Support

**Framework:** Foundry

## 🏗️ Architecture Overview

The system consists of three main contracts:

### 1. PiggyBankFactory.sol
- **Purpose**: Factory contract that deploys and manages multiple piggy bank instances
- **Key Features**:
  - Deploy ETH and ERC20 token piggy banks
  - Track all piggy banks per user
  - Collect 3% penalty fees from early withdrawals
  - Admin functions for fee management
  - Query functions for user balances and statistics

### 2. PiggyBank.sol
- **Purpose**: Individual savings account contract
- **Key Features**:
  - Support for both ETH and ERC20 tokens (chosen at creation)
  - Configurable lock periods (each instance can have different durations)
  - Penalty-free withdrawals after lock period expires
  - 3% penalty for early withdrawals (sent to factory admin)
  - Balance tracking and time-based restrictions

### 3. MockERC20.sol
- **Purpose**: Simple ERC20 token implementation for testing
- **Features**: Standard ERC20 functionality with mint function for testing

## 🚀 Key Features

### Factory Pattern
- Create multiple piggy bank instances through the factory
- Each user can have multiple piggy banks with different configurations
- Centralized management and fee collection

### Multi-Token Support
- **ETH Piggy Banks**: Native Ethereum support
- **ERC20 Piggy Banks**: Support for any ERC20 token
- Token type is immutable once set during creation

### Lock Period System
- Each piggy bank has a configurable lock period
- Different lock periods for different savings goals
- Time-based withdrawal restrictions

### Penalty System
- 3% penalty for early withdrawals (before lock period expires)
- Penalties automatically transferred to factory admin
- Penalty-free withdrawals after lock period

### Admin Features
- Factory deployer becomes admin automatically
- Collect penalty fees (ETH and ERC20 tokens)
- Query factory statistics and user data

## 📋 Contract Specifications

### PiggyBankFactory

#### Core Functions
```solidity
function createETHPiggyBank(uint256 lockPeriod) external returns (address)
function createTokenPiggyBank(address token, uint256 lockPeriod) external returns (address)
function getUserPiggyBanks(address user) external view returns (address[] memory)
function getUserTotalETHBalance(address user) external view returns (uint256)
function getUserTotalTokenBalance(address user, address token) external view returns (uint256)
```

#### Admin Functions
```solidity
function withdrawPenaltyETH(uint256 amount) external onlyAdmin
function withdrawPenaltyToken(address token, uint256 amount) external onlyAdmin
function getPenaltyETHBalance() external view returns (uint256)
function getPenaltyTokenBalance(address token) external view returns (uint256)
```

### PiggyBank

#### Core Functions
```solidity
function depositETH() external payable onlyOwner
function depositToken(uint256 amount) external onlyOwner
function withdraw(uint256 amount) external onlyOwner  // After lock period
function emergencyWithdraw(uint256 amount) external onlyOwner  // With penalty
function getBalance() public view returns (uint256)
function isLockExpired() external view returns (bool)
function getRemainingLockTime() external view returns (uint256)
```

## 🧪 Testing

The project includes comprehensive tests covering:

- ✅ Factory deployment and configuration
- ✅ ETH piggy bank creation and operations
- ✅ ERC20 token piggy bank creation and operations
- ✅ Multi-token support verification
- ✅ Lock period enforcement
- ✅ Penalty calculations and transfers
- ✅ Admin functionality
- ✅ Edge cases and error conditions
- ✅ Access control mechanisms

### Run Tests
```shell
forge test -vv
```

### Test Coverage
```shell
forge coverage
```

## 🚀 Deployment

### Prerequisites
1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
2. Set up environment variables:
   ```shell
   export PRIVATE_KEY=your_private_key
   export RPC_URL=your_rpc_url
   ```

### Deploy Factory Only
```shell
forge script script/DeployFactory.s.sol:DeployFactory --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### Deploy Factory + Test Token
```shell
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

### Local Testing with Anvil
```shell
# Terminal 1: Start local blockchain
anvil

# Terminal 2: Deploy to local network
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

## 💡 Usage Examples

### Creating Your First Piggy Bank

1. **ETH Piggy Bank with 30-day lock:**
   ```solidity
   // Connect to factory contract
   PiggyBankFactory factory = PiggyBankFactory(factoryAddress);

   // Create ETH piggy bank with 30-day lock period
   address myPiggyBank = factory.createETHPiggyBank(30 days);

   // Deposit ETH
   PiggyBank(payable(myPiggyBank)).depositETH{value: 1 ether}();
   ```

2. **Token Piggy Bank with 7-day lock:**
   ```solidity
   // Create token piggy bank
   address tokenBank = factory.createTokenPiggyBank(tokenAddress, 7 days);

   // Approve and deposit tokens
   IERC20(tokenAddress).approve(tokenBank, 1000 * 10**18);
   PiggyBank(payable(tokenBank)).depositToken(1000 * 10**18);
   ```

### Withdrawal Scenarios

1. **Normal Withdrawal (after lock period):**
   ```solidity
   PiggyBank bank = PiggyBank(payable(piggyBankAddress));

   // Check if lock period has expired
   if (bank.isLockExpired()) {
       bank.withdraw(bank.getBalance()); // No penalty
   }
   ```

2. **Emergency Withdrawal (with penalty):**
   ```solidity
   // Emergency withdrawal with 3% penalty
   bank.emergencyWithdraw(bank.getBalance());
   // 97% goes to user, 3% goes to factory admin
   ```

## 🔧 Development Commands

### Build
```shell
forge build
```

### Test
```shell
forge test -vv
```

### Format Code
```shell
forge fmt
```

### Gas Snapshots
```shell
forge snapshot
```

### Generate Documentation
```shell
forge doc
```

## 🛡️ Security Features

- **Access Control**: Only piggy bank owners can deposit/withdraw
- **Immutable Configuration**: Token type and factory address cannot be changed
- **Time-based Restrictions**: Lock periods are enforced at the blockchain level
- **Penalty System**: Automatic penalty calculation and transfer
- **Admin Controls**: Only factory admin can withdraw penalty fees

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:
- Use of `immutable` variables where possible
- Efficient storage patterns
- Minimal external calls
- Batch operations support

## 🚨 Important Notes

1. **Lock Periods**: Each piggy bank must have a different lock period as per requirements
2. **Token Approval**: ERC20 tokens require approval before deposit
3. **Penalty Calculation**: 3% penalty is calculated on the withdrawal amount
4. **Admin Rights**: Factory deployer automatically becomes admin
5. **Immutable Design**: Token type cannot be changed after piggy bank creation

## 📝 Assignment Requirements Checklist

- ✅ Factory pattern implementation
- ✅ Multiple piggy bank instances per user
- ✅ ETH and ERC20 token support
- ✅ Different lock periods for each piggy bank
- ✅ 3% penalty for early withdrawals
- ✅ Admin fee collection mechanism
- ✅ Comprehensive testing suite
- ✅ Deployment scripts
- ✅ Professional documentation

## 🤝 Contributing

This project was developed as part of the Web3bridge Week 6 assignment. For questions or improvements, please reach out to the author.

**Author:** Allan Kamau
**Web3bridge Cohort XIII**
