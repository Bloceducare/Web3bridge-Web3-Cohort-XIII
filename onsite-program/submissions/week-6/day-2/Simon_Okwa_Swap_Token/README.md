# PermitSwap - EIP-712 Off-Chain Signing for Uniswap

A Hardhat project that implements off-chain signing (EIP-712) to permit Uniswap swaps without requiring prior on-chain approval transactions.

## Features

- **EIP-712 Permit Signing**: Users can sign permit messages off-chain
- **Single Transaction Swaps**: Execute permit and swap in one transaction
- **Relayer Support**: Allow third parties to execute signed swaps
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Owner Controls**: Administrative functions for contract management
- **Comprehensive Testing**: Full test coverage with mock contracts

## Architecture

```
User (Off-chain) → Signs EIP-712 Permit → Relayer → PermitSwap Contract → Uniswap Router
```

1. **User** creates an EIP-712 signature for token approval
2. **Relayer** submits the signed permit and executes the swap
3. **PermitSwap Contract** validates the signature and performs the swap
4. **Uniswap Router** executes the actual token swap

## Smart Contracts

### Core Contracts

- **`PermitSwap.sol`**: Main contract that handles permit validation and swaps
- **`IERC20.sol`**: Standard ERC20 interface
- **`IERC20Permit.sol`**: ERC20 permit interface
- **`IUniswapRouter.sol`**: Uniswap V3 router interface

### Mock Contracts (Testing)

- **`MockUniswapRouter.sol`**: Mock router for testing
- **`MockERC20Permit.sol`**: Mock token with permit functionality

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd Simon_Okwa_Swap_Token

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=1

# Contract Addresses
UNISWAP_ROUTER=0xE592427A0AEce92De3Edee1F18E0157C05861564
PERMIT_SWAP_CONTRACT=0x... # After deployment

# User Configuration
PRIVATE_KEY=0x... # User's private key for signing
RELAYER_PRIVATE_KEY=0x... # Relayer's private key for execution

# Token Configuration
TOKEN_IN=0xA0b86a33E6441b8c4C8C0b4b4C8C0b4b4C8C0b4b # USDC
TOKEN_OUT=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 # WETH
```

### Network Configuration

Update `hardhat.config.ts` for your target networks:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    mainnet: {
      url: process.env.RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },

};

export default config;
```

## Usage

### 1. Deploy the Contract

```bash

npm run deploy


npx hardhat ignition deploy ignition/modules/deploy.ts
```

### 2. Sign Permit (Off-chain)

```bash
npm run sign-permit
```

This script:
- Generates EIP-712 typed data
- Creates permit signature
- Saves signature data to `permit-signature.json`

### 3. Execute Swap (Relayer)

```bash
npm run relayer
```

This script:
- Reads the signed permit data
- Submits the transaction to the blockchain
- Saves transaction receipt to `transaction-receipt.json`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run test suite |
| `npm run deploy` | Deploy contracts |
| `npm run sign-permit` | Generate permit signature |
| `npm run relayer` | Execute signed permit and swap |
| `npm run node` | Start local Hardhat node |
| `npm run clean` | Clean build artifacts |

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/PermitSwap.test.ts

# Run with coverage
npx hardhat coverage
```

## Security Features

- **Reentrancy Guard**: Prevents reentrancy attacks
- **Owner Controls**: Administrative functions restricted to owner
- **Input Validation**: Comprehensive parameter validation
- **Deadline Checks**: Ensures permits don't expire
- **Signature Verification**: EIP-712 compliant signature validation

## Gas Optimization

- **Single Transaction**: Permit and swap in one call
- **Efficient Storage**: Minimal storage overhead
- **Batch Operations**: Support for path-based swaps

## Events

The contract emits the following events:

- **`PermitApplied`**: When a permit is successfully applied
- **`SwapExecuted`**: When a swap is completed
- **`RouterUpdated`**: When router address is updated

## Error Handling

- **`Permit expired`**: Permit deadline has passed
- **`Invalid amount`**: Zero or invalid swap amount
- **`Invalid token addresses`**: Invalid token contract addresses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Open an issue on GitHub
- Check the documentation
- Review the test files for examples

## Roadmap

- [ ] Support for multiple DEX protocols
- [ ] Batch permit and swap operations
- [ ] Gasless permit signing
- [ ] Advanced routing algorithms
- [ ] MEV protection mechanisms
