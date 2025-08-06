# Event Contract

A smart contract for creating and managing events with NFT tickets on Ethereum.

## 🎯 Goal

The Event Contract allows organizers to:
- Create events (paid or free)
- Sell tickets as NFTs
- Withdraw proceeds from ticket sales

And allows users to:
- Buy tickets for events
- Transfer tickets to others

## 🏗️ How It Works

### Event Creation
```solidity
// Create a paid event
await eventContract.createEvent(
    "Blockchain Conference 2024",  // title
    "Join us for the conference",   // description
    futureTime,                     // start date
    futureTime + 86400,            // end date
    ethers.parseEther("0.1"),      // ticket price
    "ipfs://banner-uri",           // banner
    1,                             // paid event
    100                            // 100 tickets
);
```

### Ticket Purchase
```solidity
// Buy a ticket
await eventContract.buyTicket(1, {
    value: ethers.parseEther("0.1")
});
```

### Ticket Transfer
```solidity
// Transfer ticket to another address
await eventContract.transferFrom(
    currentOwner,
    newOwner,
    ticketId
);
```

### Withdraw Proceeds
```solidity
// Organizer withdraws proceeds
await eventContract.withdrawProceeds(eventId);
```

## 🧪 Test

```bash
npx hardhat test
```

## 🚀 Deploy

```bash
# Local
npx hardhat run scripts/simulate-event-ticketing.ts

# Testnet
npx hardhat run scripts/deploy-and-verify.ts --network lisk-sepolia
```

## 📄 License

MIT License 