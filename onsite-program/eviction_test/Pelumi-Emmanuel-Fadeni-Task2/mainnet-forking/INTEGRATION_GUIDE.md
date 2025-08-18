# Integration Guide

This guide will help you integrate and run the corrected Uniswap V2 scripts in your codebase.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd onsite-program/eviction_test/Pelumi-Emmanuel-Fadeni-Task2/mainnet-forking
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Run Tests (Optional but Recommended)
```bash
npm test
```

### 4. Execute Scripts
```bash
# Remove USDC/DAI liquidity
npm run remove-liquidity

# Remove DAI/ETH liquidity
npm run remove-liquidity-eth

# Swap ETH for DAI tokens
npm run swap-eth-for-tokens
```

## 🔧 What Was Fixed

### TypeScript Errors
- ✅ Fixed `Property 'approve' does not exist on type 'BaseContract'`
- ✅ Fixed `Property 'removeLiquidity' does not exist on type 'BaseContract'`
- ✅ Fixed `Property 'swapETHForExactTokens' does not exist on type 'BaseContract'`
- ✅ Converted `require` statements to ES6 imports
- ✅ Added proper error handling with try-catch blocks

### Configuration Issues
- ✅ Updated `hardhat.config.ts` with mainnet forking configuration
- ✅ Added proper TypeScript configuration
- ✅ Updated package.json with useful scripts

### Code Quality Improvements
- ✅ Added comprehensive error handling
- ✅ Added input validation (zero balance checks)
- ✅ Improved logging and user feedback
- ✅ Added transaction confirmation waits
- ✅ Added balance tracking before/after operations

## 📋 Integration Checklist

### Before Running Scripts:

- [ ] Ensure you have Node.js v16+ installed
- [ ] Install all dependencies with `npm install`
- [ ] Compile contracts with `npm run compile`
- [ ] Verify your Alchemy API key is working
- [ ] Run tests to validate setup: `npm test`

### Script Execution:

- [ ] Check that the impersonated account has sufficient balances
- [ ] Monitor console output for any errors or warnings
- [ ] Verify transaction hashes on a block explorer if needed
- [ ] Check final balances match expectations

## 🛠️ Customization Options

### Changing Impersonated Account
Update the `USDCHolder` variable in each script:
```typescript
const USDCHolder = "0xYourAccountAddress";
```

### Modifying Token Amounts
For swap operations, adjust the `amountOut`:
```typescript
const amountOut = ethers.parseUnits("100", 18); // 100 DAI
```

### Changing Token Pairs
Update token addresses for different pairs:
```typescript
const TokenAAddress = "0xNewTokenAddress";
const TokenBAddress = "0xAnotherTokenAddress";
```

### Adjusting Deadlines
Modify transaction deadlines:
```typescript
const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
```

## 🔍 Monitoring and Debugging

### Console Output
Each script provides detailed logging:
- Account impersonation status
- Balance checks before/after operations
- Transaction hashes and confirmations
- Error messages with context

### Common Issues and Solutions

1. **"No LP tokens to remove"**
   - The account doesn't have LP tokens for the specified pair
   - Solution: Use an account that has provided liquidity, or add liquidity first

2. **"Transaction reverted"**
   - Insufficient gas or failed transaction conditions
   - Solution: Check account balances and network conditions

3. **"Cannot connect to network"**
   - Network connectivity or RPC issues
   - Solution: Verify Alchemy API key and internet connection

4. **TypeScript compilation errors**
   - Missing dependencies or configuration issues
   - Solution: Run `npm install` and `npm run compile`

## 📊 Expected Outputs

### Remove Liquidity Scripts
```
Impersonating account: 0xf584f8728b874a6a5c7a8d4d387c9aae9172d621
Successfully impersonated account
Getting Pair Address for Uniswap Router...
LP Token Pair Address: 0x...
USDC Balance Before: 1000.0
DAI Balance Before: 500.0
Liquidity Token Balance BF Burn: 1000000000000000000
Approving LP tokens to be burnt
LP tokens approved for removal
Removing Liquidity . . . .
removeLiquidity executed at: 0x...
USDC Balance After: 1100.0
DAI Balance After: 600.0
Liquidity Token Balance AF Burn: 0
```

### Swap Script
```
Impersonating account: 0xf584f8728b874a6a5c7a8d4d387c9aae9172d621
Successfully impersonated. Signer address: 0xf584f8728b874a6a5c7a8d4d387c9aae9172d621
Connected to Uniswap V2 Router at: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
ETH Balance Before: 10.0
DAI Balance Before: 0.0
Preparing to swap ETH for DAI:
- Amount of DAI requested: 100.0
- Deadline for swap: 12/25/2024, 10:30:00 AM
- Path: [WETH -> DAI]
- ETH to be sent: 1.0
ETH required for swap: 0.05
Transaction sent! Waiting for confirmation...
swapETHForExactTokens executed successfully!
Transaction Hash: 0x...
ETH Balance After: 9.95
DAI Balance After: 100.0
ETH Used: 0.05
DAI Received: 100.0
```

## 🧪 Testing Your Integration

Run the validation tests to ensure everything works:

```bash
npm test
```

The tests will verify:
- Contract connections
- Account setup
- Token operations
- Uniswap functionality
- Script prerequisites

## 📝 Next Steps

1. **Run the scripts** with the provided npm commands
2. **Monitor the output** for any errors or unexpected behavior
3. **Customize the scripts** for your specific use cases
4. **Add additional error handling** if needed for your environment
5. **Consider adding more tests** for edge cases specific to your needs

## 🤝 Support

If you encounter any issues:
1. Check the console output for detailed error messages
2. Verify all prerequisites are met
3. Run the test suite to identify specific problems
4. Review the troubleshooting section in the main README

The scripts are now fully functional and ready for integration into your codebase!
