#!/bin/bash

echo "Deploying SVG_NFT to Sepolia network..."

# Check if environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable not set"
    exit 1
fi

if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo "Error: ETHERSCAN_API_KEY environment variable not set"
    exit 1
fi

# Deploy the contract
echo "Deploying contract..."
forge script script/DeployAndVerify.s.sol:DeployAndVerify --rpc-url sepolia --broadcast --verify

echo "Deployment completed!"
echo "Check the output above for the deployed contract address."
echo "The contract should now be visible on Sepolia Etherscan and Rarible testnet."
