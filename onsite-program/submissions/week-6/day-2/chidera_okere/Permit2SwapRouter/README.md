# PermitSwapV3

A Solidity smart contract for gasless token swaps on Uniswap V3 using Permit2 signatures, deployed on Lisk Sepolia Testnet (chain ID 4202).

## Overview

`PermitSwapV3` enables gasless token swaps by leveraging Permit2’s EIP-712 signatures for token approvals, integrated with Uniswap V3’s `SwapRouter`. Uses mock contracts for testing on Lisk Sepolia.

### Deployed Contract

- **Network**: Lisk Sepolia Testnet (chain ID 4202)
- **Contract Address**: `0xEc4c07b0Ed2a24a8aeD9F4A056277e1FDB4a8A46`
- **Deployer**: `0x0bA50b9001b2ECcd3869CC73c07031dca1e11412`
- **Previous Deployment**: `0xe1052656aec5f8F5a722e2776AaFe37C708e0cF7`

## Foundry Setup

### Prerequisites

- **Foundry**: Install `forge`, `cast`, `anvil`.
- **Node.js**: Install `npm`.
- **Dependencies**:
  ```bash
  forge install OpenZeppelin/openzeppelin-contracts@v4.9.0 --no-commit
  forge install Uniswap/v3-periphery@v1.4.0 --no-commit
  ...
  ```
