#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Create .env with: PRIVATE_KEY=your_key, RPC_URL=http://127.0.0.1:8545"
    exit 1
fi

# Load environment variables
source .env

# Set default RPC if not provided
if [ -z "$RPC_URL" ]; then
    RPC_URL="http://127.0.0.1:8545"
fi

# Check network
if ! curl -s $RPC_URL > /dev/null; then
    echo "Error: Network not accessible at $RPC_URL"
    echo "Start with: anvil --port 8545"
    exit 1
fi

# Build and deploy
echo "Building contracts..."
forge build

echo "Deploying contracts..."
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

echo "Deployment complete" 