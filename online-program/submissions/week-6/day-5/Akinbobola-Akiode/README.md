# SVG Clock NFT

An on-chain SVG NFT that dynamically displays the current time using `block.timestamp`. The NFT renders a beautiful clock face that updates every time the `tokenURI()` function is queried.

## Features

- **Dynamic Time Display**: Shows current UTC time from blockchain timestamp
- **Beautiful SVG Design**: Clean, modern clock face with hour, minute, and second hands
- **Fully On-Chain**: No external dependencies or IPFS required
- **ERC721 Compliant**: Standard NFT interface for maximum compatibility
- **Sepolia Testnet Ready**: Configured for deployment on Sepolia network

## Contract Details

- **Name**: SVG Clock
- **Symbol**: SVGC
- **Standard**: ERC721
- **Solidity Version**: ^0.8.28
- **Network**: Sepolia Testnet

## How It Works

1. **Time Calculation**: Uses `block.timestamp` to calculate current UTC time
2. **SVG Generation**: Dynamically generates SVG markup with clock hands
3. **Base64 Encoding**: Encodes SVG and JSON metadata in base64 format
4. **Dynamic Rendering**: Each `tokenURI()` call shows current time

## Deployment

### Prerequisites

- Foundry installed
- Sepolia testnet ETH
- Etherscan API key
- Private key for deployment

### Environment Variables

Create a `.env` file with:

```bash
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
INFURA_API_KEY=your_infura_api_key_here
```

### Quick Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to Sepolia
./deploy.sh
```

### Manual Deploy

```bash
# Deploy contract
forge script script/DeployAndVerify.s.sol:DeployAndVerify --rpc-url sepolia --broadcast

# Verify contract (replace CONTRACT_ADDRESS)
forge verify-contract CONTRACT_ADDRESS src/SVG_NFT.sol:SVG_NFT --chain sepolia --etherscan-api-key $ETHERSCAN_API_KEY --compiler-version 0.8.28
```

## Testing

```bash
# Run tests
forge test

# Run tests with verbose output
forge test -vvv
```

## Minting

After deployment, mint NFTs using:

```solidity
// Mint to your address
svgNFT.mint(your_address);
```

## Viewing on Rarible

1. Deploy to Sepolia testnet
2. Mint at least one NFT
3. Visit [Rarible Sepolia Testnet](https://testnet.rarible.com/)
4. Connect your wallet
5. Your NFT should appear in your collection

## Contract Functions

- `mint(address to)`: Mint a new NFT
- `tokenURI(uint256 id)`: Get metadata URI (includes dynamic SVG)
- `ownerOf(uint256 id)`: Get token owner
- `balanceOf(address owner)`: Get owner's balance
- `transferFrom(address from, address to, uint256 id)`: Transfer NFT
- `approve(address spender, uint256 id)`: Approve spender
- `setApprovalForAll(address operator, bool approved)`: Set operator approval

## Technical Details

- **SVG Viewport**: 400x400 pixels
- **Color Scheme**: Dark theme with blue accents
- **Clock Hands**: Hour (white), Minute (blue), Second (red)
- **Metadata**: JSON with base64 encoded SVG image
- **Gas Optimization**: Efficient string operations and minimal storage

## License

MIT License
