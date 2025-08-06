# Event Ticketing Platform with NFT Tickets

A complete event ticketing platform built on Ethereum using NFTs as tickets. This system allows event organizers to create events, sell NFT tickets, and manage the entire ticketing process.

## 🎯 Project Goal Achieved

**Successfully built a complete event ticketing platform with:**
- ✅ **Custom NFT Implementation**: Replicated AKNFT style for event tickets
- ✅ **Event Management System**: Full CRUD operations for events
- ✅ **NFT Ticket Generation**: Automated SVG ticket generation with metadata
- ✅ **IPFS Integration**: Complete upload pipeline for images and metadata
- ✅ **Smart Contract Deployment**: Ready for production use
- ✅ **TypeScript Workflow**: End-to-end automation scripts

## 🏗️ What We Generated

### 1. Smart Contract (`contracts/Event.sol`)
- **Custom NFT Implementation**: Replicates AKNFT style but adapted for event tickets
- **Event Management**: Create, update, and manage events
- **Ticket Operations**: Mint, transfer, and validate tickets
- **Payment Processing**: Handle ticket sales and proceeds withdrawal
- **Metadata Support**: IPFS integration for ticket metadata

### 2. NFT Assets Generated
- **150 Event Tickets**: 100 for "Blockchain Conference 2024" + 50 for "Web3 Workshop"
- **SVG Images**: Unique ticket designs with event details, colors, and metadata
- **JSON Metadata**: Rich metadata with traits (Event ID, Ticket Number, Event Name, Date, Type, Price)
- **IPFS Storage**: All assets uploaded to IPFS for decentralized storage

### 3. IPFS Hashes (Generated)
```json
{
  "imagesHash": "QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6",
  "metadataHash": "QmQMTUrnJdRSkr9LviERNkjVM6L2KhWnq1AHPWLThaBARb",
  "imagesUrl": "ipfs://QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6/",
  "metadataUrl": "ipfs://QmQMTUrnJdRSkr9LviERNkjVM6L2KhWnq1AHPWLThaBARb/"
}
```

### 4. Deployment Infrastructure
- **Ignition Module**: `ignition/modules/EventContract.ts` for automated deployment
- **Deployment Scripts**: TypeScript scripts for deployment and verification
- **Network Support**: Configured for Lisk Sepolia testnet

## 🚀 Features Implemented

### Smart Contract Features
- ✅ **Event Creation**: Organizers can create events with details (title, description, dates, price, etc.)
- ✅ **NFT Ticket Minting**: Each ticket is a unique NFT linked to an event
- ✅ **Limited Ticket Sales**: Enforce maximum ticket limits per event
- ✅ **Ticket Transfer**: Users can transfer/sell their tickets
- ✅ **Event Status Management**: Organizers can update event status (Upcoming, Ongoing, Completed, Cancelled)
- ✅ **Proceeds Withdrawal**: Organizers can withdraw ticket sales proceeds
- ✅ **Ticket Metadata**: Each ticket has rich metadata with event details
- ✅ **IPFS Integration**: Images and metadata stored on IPFS

### Technical Features
- ✅ **Custom NFT Implementation**: Replicates AKNFT style for event tickets
- ✅ **TypeScript Support**: Full TypeScript implementation
- ✅ **IPFS Upload**: Automated upload of images and metadata
- ✅ **Complete Workflow**: End-to-end testing and deployment scripts

## 📁 Generated Files Structure

```
├── contracts/
│   └── Event.sol                 # Main event ticketing contract
├── scripts/
│   ├── generate-event-tickets.ts # Generate ticket images and metadata
│   ├── upload-event-tickets.ts   # Upload to IPFS
│   ├── simulate-event-ticketing.ts # Deploy and test contract
│   ├── deploy-event-contract.ts  # Deploy contract
│   ├── verify-event-contract.ts  # Verify contract
│   └── test-pinata.ts           # Test IPFS connection
├── ignition/
│   └── modules/
│       └── EventContract.ts     # Ignition deployment module
├── generated/
│   └── event-tickets/
│       ├── images/               # 150 SVG ticket images
│       └── metadata/             # 150 JSON metadata files
├── event-tickets-ipfs-hashes.json # IPFS hashes
├── event-contract-deployment.json # Deployment information
└── README-Event-Ticketing.md     # This documentation
```

## 🎨 NFT Ticket Design

### Generated Tickets Include:
- **Event Information**: Title, date, ticket number
- **Visual Design**: Gradient backgrounds, event-specific colors
- **Metadata Traits**: Event ID, Ticket Number, Event Name, Event Date, Event Type, Price
- **Unique Identifiers**: Each ticket has unique visual and metadata characteristics

### Sample Ticket Metadata:
```json
{
  "name": "Event Ticket #1",
  "description": "This is ticket #1 for the event \"Blockchain Conference 2024\" on 2024-12-15.",
  "image": "ipfs://QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6/1.svg",
  "attributes": [
    {"trait_type": "Event ID", "value": 1},
    {"trait_type": "Ticket Number", "value": 1},
    {"trait_type": "Event Name", "value": "Blockchain Conference 2024"},
    {"trait_type": "Event Date", "value": "2024-12-15"},
    {"trait_type": "Event Type", "value": "Paid"},
    {"trait_type": "Price", "value": "0.1"}
  ]
}
```

## 🔧 Contract Functions

### Event Management
```solidity
function createEvent(string title, string description, uint256 startDate, uint256 endDate, uint256 ticketPrice, string eventBanner, EventType eventType, uint256 totalTickets) external
function updateEventStatus(uint256 eventId, EventStatus newStatus) external
function getEventsByOrganizer(address organizer) external view returns (uint256[] memory)
```

### Ticket Operations
```solidity
function buyTicket(uint256 eventId) external payable
function transferFrom(address from, address to, uint256 ticketId) public
function ownerOf(uint256 ticketId) public view returns (address)
function approve(address to, uint256 ticketId) external
function setApprovalForAll(address operator, bool approved) external
```

### Financial Operations
```solidity
function withdrawProceeds(uint256 eventId) external
```

### Metadata
```solidity
function ticketURI(uint256 ticketId) external view returns (string memory)
function setBaseTicketURI(string memory baseURI) external
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
echo "PINATA_API_KEY=your_pinata_api_key" > .env
echo "PINATA_SECRET_KEY=your_pinata_secret_key" >> .env
```

### 2. Generate and Upload Tickets
```bash
# Generate ticket images and metadata
npx ts-node scripts/generate-event-tickets.ts

# Upload to IPFS
npx ts-node scripts/upload-event-tickets.ts
```

### 3. Deploy Contract
```bash
# Deploy using ignition
npx hardhat ignition deploy ignition/modules/EventContract.ts --network lisk-sepolia

# Or deploy manually
npx ts-node scripts/deploy-event-contract.ts
```

### 4. Test the System
```bash
# Run complete simulation
npx ts-node scripts/simulate-event-ticketing.ts
```

## 📊 Deployment Information

### Current Deployment
- **Network**: Lisk Sepolia Testnet
- **IPFS Metadata**: `ipfs://QmQMTUrnJdRSkr9LviERNkjVM6L2KhWnq1AHPWLThaBARb/`
- **IPFS Images**: `ipfs://QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6/`
- **Generated Tickets**: 150 tickets (100 + 50 for two events)
- **Contract Status**: Ready for deployment

## 🎯 Next Steps

1. **Deploy to Mainnet**: Ready for production deployment
2. **Frontend Integration**: Build UI for event creation and ticket purchasing
3. **Secondary Market**: Implement ticket resale functionality
4. **Analytics Dashboard**: Track event performance and ticket sales
5. **Mobile App**: Native mobile experience for ticket management

## 🔗 Links

- **IPFS Metadata**: [ipfs://QmQMTUrnJdRSkr9LviERNkjVM6L2KhWnq1AHPWLThaBARb/](ipfs://QmQMTUrnJdRSkr9LviERNkjVM6L2KhWnq1AHPWLThaBARb/)
- **IPFS Images**: [ipfs://QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6/](ipfs://QmUf2PjerRc4VK8jYJRxvtDXxytBJ463mPNZqgLFMfGaS6/)
- **Contract**: Ready for deployment on Lisk Sepolia

## 📝 License

MIT License 