# DeFi Staking dApp

A professional DeFi staking application built with Next.js, ethers.js, and Tailwind CSS. This dApp allows users to stake tokens, earn rewards, and manage their staking positions through a modern Web3 interface.

## Features

- **Wallet Connection**: Connect MetaMask and other Web3 wallets
- **Token Staking**: Stake tokens with dynamic APR rewards
- **Reward System**: Claim accumulated rewards
- **Withdrawal**: Withdraw staked tokens after lock period
- **Emergency Withdrawal**: Emergency exit with penalty
- **Real-time Stats**: Live protocol and user statistics
- **Responsive Design**: Mobile-first responsive interface
- **Dark/Light Mode**: Automatic theme switching

## Smart Contract Integration

The dApp integrates with a comprehensive staking smart contract that includes:

- Dynamic APR based on total staked amount
- Minimum lock duration requirements
- Emergency withdrawal with penalties
- Reward accumulation and claiming
- Admin controls for pausing/unpausing

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
git clone
cd staking-dapp
npm install
\`\`\`

### 2. Configure Contract Addresses

Edit `lib/contract.ts` and update the contract addresses:

\`\`\`typescript
export const STAKING_CONTRACT_ADDRESS = 0x980ea342e9b0fbea220ad7e0d2452429e4a2774a;
export const STAKING_TOKEN_ADDRESS = "0x46fc0f600d7edf673f0b1b42e6cacbc5bd86810e";
\`\`\`

### 3. Deploy Smart Contract

1. Deploy the staking contract to Sepolia testnet
2. Deploy or use an existing ERC20 token for staking
3. Update the addresses in the configuration file

### 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the dApp.

## Contract Configuration

The smart contract should be deployed with these parameters:

- `_stakingToken`: Address of the ERC20 token to be staked
- `_initialApr`: Initial APR percentage (e.g., 1000 for 10%)
- `_minLockDuration`: Minimum lock duration in seconds (e.g., 86400 for 24 hours)
- `_aprReductionPerThousand`: APR reduction per 1000 tokens staked
- `_emergencyWithdrawPenalty`: Penalty percentage for emergency withdrawal (0-100)

## Network Support

Currently configured for:

- **Sepolia Testnet** (Chain ID: 11155111)
- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)

## File Structure

\`\`\`
├── app/
│ ├── page.tsx # Main application page
│ ├── layout.tsx # Root layout with fonts
│ └── globals.css # Global styles and design tokens
├── components/
│ ├── wallet-connect.tsx # Wallet connection component
│ ├── staking-form.tsx # Staking interface
│ ├── user-stats.tsx # User position display
│ └── protocol-stats.tsx # Protocol statistics
├── hooks/
│ └── use-web3.ts # Web3 integration hook
├── lib/
│ └── contract.ts # Contract addresses and ABIs
└── README.md
\`\`\`

## Key Components

### WalletConnect

- MetaMask integration
- Network detection
- Account management
- Connection status

### StakingForm

- Token staking interface
- Withdrawal functionality
- Reward claiming
- Emergency withdrawal

### UserStats

- Personal staking position
- Pending rewards
- Lock status and countdown
- Stake history

### ProtocolStats

- Total value locked (TVL)
- Current APR
- Available rewards
- Protocol status

## Web3 Integration

The dApp uses ethers.js v6 for blockchain interaction:

- Contract interaction through typed interfaces
- Automatic transaction handling
- Error management and user feedback
- Real-time data updates

## Design System

Built with a professional DeFi aesthetic:

- **Primary Color**: Cyan (#164e63) for trust and stability
- **Accent Color**: Orange (#f97316) for call-to-action elements
- **Typography**: Geist Sans for clean, modern text
- **Components**: shadcn/ui for consistent UI elements

## Security Considerations

- Contract addresses are configurable
- User input validation
- Transaction error handling
- Network verification
- Allowance management for token approvals

## Deployment

### Frontend Deployment (Vercel)

\`\`\`bash
npm run build

# Deploy to Vercel or your preferred hosting platform

\`\`\`

### Contract Deployment

1. Use Hardhat, Foundry, or Remix to deploy the contract
2. Verify the contract on Etherscan
3. Update the contract addresses in the dApp configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
