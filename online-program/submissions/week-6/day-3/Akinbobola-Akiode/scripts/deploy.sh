#!/bin/bash

if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Create .env with: PRIVATE_KEY=your_key, RPC_URL=http://127.0.0.1:8545"
    exit 1
fi

source .env

if [ -z "$RPC_URL" ]; then
    RPC_URL="http://127.0.0.1:8545"
fi

if ! curl -s $RPC_URL > /dev/null; then
    echo "Error: Network not accessible at $RPC_URL"
    echo "Start with: anvil --port 8545"
    exit 1
fi

forge build
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast 