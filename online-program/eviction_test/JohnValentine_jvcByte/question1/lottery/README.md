# Lottery Smart Contract

A decentralized lottery system built on Ethereum that allows participants to join by paying an entry fee, with a random winner selected after 10 participants have joined.

## Features

- **Secure Entry**: Only allows entry with the exact fee (0.01 ETH)
- **Automatic Winner Selection**: Randomly selects a winner after 10 participants join
- **Fair Distribution**: Prize pool is distributed to a single winner
- **Reset Functionality**: Contract can be reset for a new lottery round
- **Access Control**: Only contract can execute winner selection, only owner can reset

## Contract Details

- **Entry Fee**: 0.01 ETH
- **Participants Required**: 10
- **Winner Selection**: Random selection using on-chain data
- **Prize**: Entire contract balance (10 * 0.01 ETH = 0.1 ETH)

## Deployment

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lottery
   ```

2. **Install dependencies**
   ```bash
   forge install
   ```

3. **Build the project**
   ```bash
   forge build
   ```

4. **Run tests**
   ```bash
   forge test
   ```

### Deploying to a Network

1. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   PRIVATE_KEY=your_private_key
   RPC_URL=your_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. **Deploy the contract**
   ```bash
   # For local deployment
   forge script script/Lottery.s.sol:DeployLottery --broadcast --rpc-url $RPC_URL --private-key $PRIVATE_KEY

   # For testnet (e.g., Sepolia)
   forge script script/Lottery.s.sol:DeployLottery --broadcast --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --verify -vvvv
   ```

## Contract Addresses

- **Base Sepolia Testnet**: `0x8125F0b8CdE63A30d8948fb7ecbF475F8Ae6B93b`
- **Ethereum Mainnet**: `[To be deployed]`

## Usage

### Joining the Lottery

1. Call the `join()` function with exactly 0.01 ETH
2. Wait for 10 participants to join
3. The contract will automatically select a winner

### Checking Status

- `getParticipantCount()`: Get current number of participants
- `hasJoined(address)`: Check if an address has joined
- `winner()`: Get the address of the current winner

## Security Considerations

- Only the contract itself can execute the winner selection
- The contract owner can reset the lottery after a winner is selected
- All ETH transfers are handled securely with checks for success

## License

SPDX-License-Identifier: MIT
