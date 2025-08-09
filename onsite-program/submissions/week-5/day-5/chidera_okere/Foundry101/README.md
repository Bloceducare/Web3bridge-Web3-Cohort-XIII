# Event Ticketing System

A decentralized event ticketing platform built on Ethereum using Solidity. Users can create events, buy tickets with custom tokens, and receive NFTs as proof of purchase.

## 🏗️ System Architecture

The system consists of 4 main smart contracts:

1. **TicketToken (TKT)** - ERC20 token used as payment currency
2. **TicketNft** - ERC721 NFT representing ticket ownership
3. **EventTicketing** - Main contract managing events and ticket sales
4. **TokenSale** - Allows users to buy TKT tokens with ETH

## 🚀 Deployed Contracts (Lisk Sepolia Testnet)

| Contract       | Address                                      | Purpose              |
| -------------- | -------------------------------------------- | -------------------- |
| TicketToken    | `0x2b63b9670d3089342823f2e4A38b42689b40881C` | Payment token (TKT)  |
| TicketNft      | `0x6F67D9F7515e0126C0aFb1262CF6e4E860b822AF` | NFT tickets          |
| EventTicketing | `0x60370A7fD8d54C28Cf0f7552ba369d60296E3166` | Main ticketing logic |
| TokenSale      | `0x86aadce8f673Ef9D332F1b027D71a0C8f22294B0` | Token purchase       |

**Network**: Lisk Sepolia (Chain ID: 4202)  
**RPC URL**: `https://rpc.sepolia-api.lisk.com`

## 💰 Token Economics

- **Total Supply**: 1,000,000 TKT
- **Available for Sale**: 500,000 TKT
- **Token Price**: 0.001 ETH per TKT (1 milliETH)
- **Deployer Balance**: 500,000 TKT

## 🎫 How It Works

### For Users:

1. **Buy TKT Tokens**: Send ETH to TokenSale contract to get TKT tokens
2. **Browse Events**: View available events created by organizers
3. **Purchase Tickets**: Use TKT tokens to buy event tickets
4. **Receive NFT**: Get an NFT as proof of ticket ownership

### For Event Organizers:

1. **Create Events**: Call `createTicket()` with event details and pricing
2. **Receive Payments**: Get TKT tokens directly when users buy tickets
3. **Track Attendees**: View list of ticket holders for each event

## 🛠️ Development Setup

### Prerequisites

- Node.js & npm
- Foundry (Forge, Cast, Anvil)
- Git

### Installation

```bash
git clone <your-repo>
cd foundry-ticketing
forge install
```

### Environment Setup

Create a `.env` file:

```bash
PRIVATE_KEY=0x...
LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com
```

### Build & Test

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to Lisk Sepolia
forge script script/EventTicketing.s.sol:DeployWithConfig \
  --rpc-url $LISK_SEPOLIA_RPC \
  --broadcast \
  --verify
```

## 📖 Contract Functions

### TicketToken (ERC20)

- Standard ERC20 functions: `transfer()`, `balanceOf()`, `approve()`

### TokenSale

- `buyTokens()` - Purchase TKT tokens with ETH

### EventTicketing

- `createTicket()` - Create a new event
- `buyTicket()` - Purchase a ticket for an event
- `getTicketDetails()` - Get event information
- `getUserTickets()` - Get user's owned tickets
- `getEventAttendees()` - Get event attendee list

### TicketNft (ERC721)

- Standard ERC721 functions: `ownerOf()`, `tokenURI()`, etc.
- `mint()` - Create new NFT (only EventTicketing contract)

## 🔧 Usage Examples

### Interact with Contracts using Cast

```bash
# Check TKT balance
cast call $TICKET_TOKEN_ADDRESS "balanceOf(address)" $YOUR_ADDRESS --rpc-url $LISK_SEPOLIA_RPC

# Buy TKT tokens (send 0.01 ETH)
cast send $TOKEN_SALE_ADDRESS "buyTokens()" --value 0.01ether --rpc-url $LISK_SEPOLIA_RPC --private-key $PRIVATE_KEY

# Create an event
cast send $EVENT_TICKETING_ADDRESS "createTicket(uint256,uint256,string,string,string,string)" \
  100000000000000000000 10 "Concert" "2024-12-31" "Madison Square Garden" "Amazing concert event" \
  --rpc-url $LISK_SEPOLIA_RPC --private-key $PRIVATE_KEY

# Buy a ticket (approve tokens first)
cast send $TICKET_TOKEN_ADDRESS "approve(address,uint256)" $EVENT_TICKETING_ADDRESS 100000000000000000000 \
  --rpc-url $LISK_SEPOLIA_RPC --private-key $PRIVATE_KEY

cast send $EVENT_TICKETING_ADDRESS "buyTicket(uint256)" 0 \
  --rpc-url $LISK_SEPOLIA_RPC --private-key $PRIVATE_KEY
```

## 🔍 Block Explorer

View contracts on Lisk Sepolia BlockScout:

- **Explorer**: https://sepolia-blockscout.lisk.com/
- Search using contract addresses above

## 🛡️ Security Features

- **Ownership Control**: Only EventTicketing can mint NFTs
- **Access Control**: Event organizers receive payments directly
- **Balance Checks**: Ensures users have sufficient tokens before purchase
- **Quantity Limits**: Prevents overselling of tickets
- **Event Status**: Active/Expired status management

## 🚧 Known Limitations

1. **No Refund Mechanism**: Tickets cannot be returned
2. **No Event Expiry Logic**: EXPIRED status defined but not implemented
3. **TokenSale Bug**: Owner receives full ETH instead of exact cost
4. **Centralized NFT Control**: Main contract controls all NFT minting

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues:

- Open an issue on GitHub
- Check the contract addresses above
- Verify network is Lisk Sepolia (Chain ID: 4202)

---

**Happy Ticketing! 🎉**
