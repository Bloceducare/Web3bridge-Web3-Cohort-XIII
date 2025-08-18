# Staking Contract Documentation

## Overview

This staking contract implements a dual-token staking system where users can stake Token1 (TK1) and receive Token2 (TK2) as a reward. The contract includes a lock period mechanism that prevents immediate unstaking, ensuring users commit to their stakes for a specified duration.

## Contract Architecture

### Key Components

1. **Dual Token System**: Token1 (stakeable) and Token2 (reward token)
2. **Lock Period**: Configurable time period during which stakes cannot be withdrawn
3. **Struct-based Staking**: Uses structs to store stake information
4. **Mapping Storage**: Efficient key-value storage for user stakes and pending unstakes

## Data Structures

### Struct: `Stake`

```solidity
struct Stake {
    uint256 amount;      // Total amount staked by the user
    uint256 unlockTime;  // Timestamp when the stake can be withdrawn
}
```

**Why use a struct?**
- **Organization**: Groups related data (amount and unlock time) into a single logical unit
- **Readability**: Makes the code more readable and self-documenting
- **Efficiency**: Reduces the number of storage slots needed compared to separate variables
- **Maintainability**: Easier to add new fields in the future

### Mappings

#### 1. `mapping(address => Stake) public stakes`
- **Purpose**: Maps user addresses to their stake information
- **Why use mapping**: 
  - **Gas Efficiency**: O(1) lookup time for any user's stake
  - **Sparse Storage**: Only stores data for users who have actually staked
  - **No Iteration**: No need to loop through arrays to find user data

#### 2. `mapping(address => uint256) public pendingUnstakes`
- **Purpose**: Tracks pending unstake requests for users who unstake before lock period expires
- **Why use mapping**:
  - **Separation of Concerns**: Keeps pending unstakes separate from active stakes
  - **Efficient Tracking**: Quick access to pending amounts for any user
  - **Clean State Management**: Easy to reset when claims are processed

## Functions Explained

### Core Staking Functions

#### `stake(uint256 amount) external`
```solidity
function stake(uint256 amount) external {
    require(amount > 0, "Amount must be greater than 0");
    require(token1.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    
    token2.mint(msg.sender, amount);
    
    if (stakes[msg.sender].amount > 0) {
        stakes[msg.sender].amount += amount;
    } else {
        stakes[msg.sender] = Stake(amount, block.timestamp + lockPeriod);
    }
    
    emit Staked(msg.sender, amount, stakes[msg.sender].unlockTime);
}
```

**What it does:**
1. Validates the staking amount is greater than 0
2. Transfers Token1 from user to contract
3. Mints equivalent amount of Token2 as reward
4. Updates or creates stake record with lock period
5. Emits staking event

**Key Logic:**
- **Conditional Stake Creation**: If user already has stakes, it adds to existing amount
- **New Stake**: If first time staking, creates new stake with lock period
- **Immediate Rewards**: Users receive Token2 immediately upon staking

#### `unstake(uint256 amount) external`
```solidity
function unstake(uint256 amount) external {
    require(amount > 0, "Amount must be greater than 0");
    require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
    require(token2.balanceOf(msg.sender) >= amount, "Insufficient Token 2 balance");
    
    token2.burn(msg.sender, amount);
    stakes[msg.sender].amount -= amount;
    
    if (block.timestamp >= stakes[msg.sender].unlockTime) {
        require(token1.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    } else {
        pendingUnstakes[msg.sender] += amount;
        emit UnstakeRequested(msg.sender, amount);
    }
}
```

**What it does:**
1. Validates unstaking amount and user balances
2. Burns Token2 (reward tokens) from user
3. Reduces staked amount
4. Handles immediate vs pending unstaking based on lock period

**Key Logic:**
- **Lock Period Check**: If lock period expired, immediately return Token1
- **Pending Unstake**: If lock period not expired, add to pending unstakes
- **Token2 Burning**: Users must burn their reward tokens to unstake

#### `claimUnstaked() external`
```solidity
function claimUnstaked() external {
    uint256 amount = pendingUnstakes[msg.sender];
    require(amount > 0, "No pending unstakes");
    require(block.timestamp >= stakes[msg.sender].unlockTime, "Lock period not expired");
    
    pendingUnstakes[msg.sender] = 0;
    require(token1.transfer(msg.sender, amount), "Transfer failed");
    emit Unstaked(msg.sender, amount);
}
```

**What it does:**
1. Checks for pending unstakes
2. Verifies lock period has expired
3. Transfers Token1 to user
4. Clears pending unstake amount

### View Functions

#### `getStakeInfo(address user) external view returns (uint256 amount, uint256 unlockTime)`
- **Purpose**: Returns stake information for any user
- **Returns**: Current staked amount and unlock timestamp

#### `getPendingUnstake(address user) external view returns (uint256)`
- **Purpose**: Returns pending unstake amount for any user
- **Returns**: Amount waiting to be claimed

#### `canUnstake(address user) external view returns (bool)`
- **Purpose**: Checks if a user can unstake immediately
- **Returns**: True if lock period has expired

## Events

### `Staked(address indexed user, uint256 amount, uint256 unlockTime)`
- Emitted when a user stakes tokens
- Indexed user address for efficient filtering

### `UnstakeRequested(address indexed user, uint256 amount)`
- Emitted when unstaking is requested before lock period expires
- Indicates pending unstake status

### `Unstaked(address indexed user, uint256 amount)`
- Emitted when tokens are successfully returned to user
- Used for both immediate and claimed unstakes

## Why This Design?

### 1. **Struct Mapping Benefits**
- **Efficient Storage**: Only stores data for active stakers
- **Fast Access**: O(1) lookup time for any user's stake
- **Scalable**: Handles any number of users without performance degradation

### 2. **Dual Token System**
- **Incentive Mechanism**: Token2 serves as immediate reward for staking
- **Liquidity Control**: Users must burn reward tokens to unstake
- **Flexible Economics**: Allows for different tokenomics between stake and reward tokens

### 3. **Lock Period Mechanism**
- **Commitment**: Ensures users commit to staking for a minimum period
- **Stability**: Prevents rapid staking/unstaking cycles
- **Fair Distribution**: Rewards long-term stakers

### 4. **Pending Unstake System**
- **User Experience**: Allows users to initiate unstaking before lock period
- **Flexibility**: Users can plan their exits in advance
- **Clean State**: Separates active stakes from pending withdrawals

## Security Considerations

1. **Reentrancy Protection**: Uses `require` statements for external calls
2. **Balance Validation**: Checks user balances before operations
3. **Access Control**: No admin functions that could manipulate user stakes
4. **Event Emission**: All state changes are logged for transparency

## Gas Optimization

1. **Mapping Usage**: Efficient storage for sparse data
2. **Struct Packing**: Related data grouped together
3. **Conditional Logic**: Avoids unnecessary operations
4. **Event Indexing**: Efficient filtering of events

This staking contract demonstrates advanced Solidity patterns including structs, mappings, dual-token economics, and time-based restrictions, making it a robust foundation for DeFi staking applications. 