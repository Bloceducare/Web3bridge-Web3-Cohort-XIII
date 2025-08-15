# Clock NFT

A dynamic on-chain NFT that displays real-time blockchain timestamp as pixel art.

## Contract Details

- **Network**: Lisk Sepolia Testnet
- **Contract Address**: `0x8C9847b4D726c2461C1b45dFA17A07da8B82DaC2`
- **Verified**: ✅ [View on Blockscout](https://sepolia-blockscout.lisk.com/address/0x8C9847b4D726c2461C1b45dFA17A07da8B82DaC2#code)

## Features

- Dynamic pixel art that changes based on `block.timestamp`
- Hair color changes throughout the day
- Eyes blink every even minute
- Moving elements based on seconds
- Fully on-chain SVG generation

## Deployment

```bash
npx hardhat ignition deploy ignition/modules/Unique.ts --network liskTestnet
npx hardhat ignition verify sepolia-deployment
```

## Usage

Call `mint()` to mint a new dynamic clock NFT. Each view of `tokenURI()` generates a unique image based on the current blockchain time.
