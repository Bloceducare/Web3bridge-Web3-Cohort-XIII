# ERC20 Token Contract

A standard ERC20 token implementation built on Solidity that provides basic fungible token functionality including transfers, approvals, and allowance management.

## 📋 Overview

This ERC20 contract implements the standard token interface allowing for:
- **Token Transfers**: Direct transfers between addresses
- **Approval System**: Delegate spending permissions to other addresses
- **Allowance Management**: Control how much tokens others can spend on your behalf
- **Standard Compliance**: Full ERC20 interface implementation

## 🏗️ Contract Architecture

### Core Components

- **ERC20.sol**: Main token contract implementing IERC20 interface
- **IERC20.sol**: Standard ERC20 interface defining required functions
- **State Variables**: Track balances, allowances, and token metadata
- **Events**: Emit Transfer and Approval events for transparency

### Token Properties

```solidity
string public name;        // Token name (e.g., "My Token")
string public symbol;      // Token symbol (e.g., "MTK")
uint8 public decimals;     // Number of decimal places
uint256 public totalSupply; // Total token supply
```

## 🔧 Core Functions

### Token Information

| Function | Description | Returns |
|----------|-------------|---------|
| `name` | Returns the token name | `string` |
| `symbol` | Returns the token symbol | `string` |
| `decimals` | Returns number of decimal places | `uint8` |
| `totalSupply` | Returns total token supply | `uint256` |

### Balance & Allowance Queries

| Function | Description | Returns |
|----------|-------------|---------|
| `balanceOf(address account)` | Returns token balance of an address | `uint256` |
| `allowance(address owner, address spender)` | Returns approved spending amount | `uint256` |

### Core Operations

| Function | Description | Access |
|----------|-------------|---------|
| `transfer(address recipient, uint256 amount)` | Transfer tokens to recipient | Public |
| `approve(address spender, uint256 amount)` | Approve spender to use tokens | Public |
| `transferFrom(address sender, address recipient, uint256 amount)` | Transfer tokens on behalf of sender | Public |

## 📜 Function Details

### Transfer Operations

#### `transfer(address recipient, uint256 amount)`
- Transfers tokens directly from caller to recipient
- Deducts amount from sender's balance
- Adds amount to recipient's balance
- Emits `Transfer` event
- Returns `true` on success

#### `transferFrom(address sender, address recipient, uint256 amount)`
- Transfers tokens from sender to recipient using allowance
- Requires prior approval from sender
- Deducts from both allowance and sender's balance
- Adds amount to recipient's balance
- Emits `Transfer` event
- Returns `true` on success

### Approval System

#### `approve(address spender, uint256 amount)`
- Grants permission for spender to use caller's tokens
- Sets allowance amount for the spender
- Emits `Approval` event
- Returns `true` on success

## 📊 Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

### Event Details

- **Transfer**: Emitted when tokens move between addresses
  - `from`: Source address (address(0) for minting)
  - `to`: Destination address (address(0) for burning)
  - `value`: Amount of tokens transferred

- **Approval**: Emitted when allowance is set
  - `owner`: Token holder granting permission
  - `spender`: Address receiving permission
  - `value`: Amount approved for spending

## 🔍 State Variables

### Public Mappings

```solidity
mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;
```

- **balanceOf**: Maps addresses to their token balances
- **allowance**: Maps owner addresses to spender addresses and approved amounts

## 🎯 Usage Examples

### Basic Token Transfer
```solidity
// Transfer 100 tokens to recipient
token.transfer(recipientAddress, 100 * 10**decimals);
```

### Approval and Delegated Transfer
```solidity
// Owner approves spender to use 50 tokens
token.approve(spenderAddress, 50 * 10**decimals);

// Spender transfers tokens on behalf of owner
token.transferFrom(ownerAddress, recipientAddress, 25 * 10**decimals);
```

### Checking Balances and Allowances
```solidity
// Check token balance
uint256 balance = token.balanceOf(userAddress);

// Check allowance
uint256 approved = token.allowance(ownerAddress, spenderAddress);
```

## ⚠️ Important Notes

### Security Considerations
- **No Access Control**: This basic implementation has no minting or administrative functions
- **Arithmetic Operations**: Uses Solidity 0.8+ built-in overflow protection
- **No Validation**: Transfer functions don't validate recipient addresses or amounts
- **Standard Compliance**: Follows ERC20 standard exactly as specified

### Implementation Details
- Uses direct arithmetic operations (+=, -=) which will revert on underflow/overflow
- No zero-address checks implemented in basic version
- No additional safety features beyond standard ERC20 requirements
- Constructor sets token metadata (name, symbol, decimals) immutably

### Decimal Handling
- Token amounts should account for decimal places
- If decimals = 18, then 1 token = 1 * 10^18 units
- All internal calculations use the smallest unit

## 🌐 Deployment

**Network**: Lisk Sepolia Testnet  
**Block Explorer**: [View on Lisk Sepolia Explorer](https://sepolia-blockscout.lisk.com/address/0xdCB71EA41e5498A9b7E3E42172e97D489b717298#code)

## 🔧 Constructor Parameters

When deploying, provide:
- `_name`: Human-readable token name (e.g., "My Token")
- `_symbol`: Token symbol/ticker (e.g., "MTK")  
- `_decimals`: Number of decimal places (commonly 18)

## 📈 Token Economics

- **Initial Supply**: Set to 0 (no tokens minted in constructor)
- **Supply Management**: No built-in mint/burn functions
- **Distribution**: Requires separate mechanism to distribute initial tokens
- **Scalability**: Standard ERC20 with efficient storage patterns

---

*This contract provides a clean, standard-compliant ERC20 token implementation suitable for basic fungible token use cases on the Ethereum blockchain.*