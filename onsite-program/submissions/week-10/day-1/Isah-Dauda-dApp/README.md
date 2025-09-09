# 🚀 Web3 Staking dApp

A modern decentralized staking application built with React, Wagmi v2, and RainbowKit for Ethereum Sepolia testnet.

## 🌟 Overview

This dApp allows users to stake ERC-20 tokens and earn rewards with a clean, responsive interface. Features real-time updates, dynamic APR calculation, and comprehensive position management.

**Live Features:**
- 💰 Token staking with 3-minute lock period
- 🎯 Dynamic APR (starts at 250%, decreases with TVL)
- ⚡ Real-time rewards (updates every 10 seconds)
- 🔒 Emergency withdraw (50% penalty)
- 📱 Responsive design for all devices

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **Network**: Ethereum Sepolia Testnet
- **State**: React hooks + localStorage persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or Web3 wallet
- Sepolia testnet ETH

### Installation
```bash
# Clone repository
git clone https://github.com/trinnode/Staking-dApp.git
cd Staking-dApp

# Install dependencies
npm install

# Start development server
npm run dev
```

### Setup
1. Connect your wallet to Sepolia testnet
2. Get testnet tokens from faucets
3. Start staking and earning rewards!

## 🎯 How It Works

### Staking Process
1. **Connect Wallet** → Choose from multiple wallet options
2. **Approve Tokens** → One-time approval for the staking contract
3. **Stake Amount** → Enter desired amount and confirm transaction
4. **Earn Rewards** → Rewards accumulate every 10 seconds automatically
5. **Withdraw** → After 3-minute lock period expires

### Reward System
- **Base APR**: 250% annually
- **Dynamic Reduction**: APR decreases by 0.5% per 1,000 tokens staked
- **Minimum APR**: 10% (protection floor)
- **Reward Frequency**: Every 10 seconds
- **Auto-compound**: Rewards compound when staking/withdrawing

### Lock Period
- **Duration**: 3 minutes from last stake
- **Purpose**: Prevents MEV attacks and ensures protocol stability
- **Emergency Option**: Immediate withdraw with 50% penalty

## 📱 Interface Components

### Main Dashboard
- **User Position Card**: Shows staked amount, rewards, lock status
- **Protocol Stats Card**: TVL, APR, total rewards with responsive layout
- **Action Cards**: Stake, withdraw, claim rewards, emergency withdraw

### Real-time Features
- Live reward updates every 10 seconds
- Dynamic APR calculation based on TVL
- Lock timer with countdown display
- Transaction status notifications

## ⚙️ Protocol Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Lock Period | 3 minutes | Minimum staking duration |
| Base APR | 250% | Starting annual percentage rate |
| APR Reduction | 0.5% per 1k | Dynamic rate adjustment |
| Min APR | 10% | Floor rate protection |
| Emergency Penalty | 50% | Early withdrawal fee |
| Update Interval | 10 seconds | Reward calculation frequency |

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── StakingCard.jsx     # Token staking interface
│   ├── WithdrawalCard.jsx  # Token withdrawal
│   ├── RewardsCard.jsx     # Rewards claiming
│   └── ProtocolStatsCard.jsx # Protocol statistics
├── hooks/              # Custom React hooks
│   ├── useStakingContract.js # Contract interactions
│   ├── useUserStakingData.js # User data aggregation
│   └── useProtocolStats.js   # Protocol statistics
├── utils/              # Utility functions
│   ├── abis.js            # Contract ABIs
│   ├── constants.js       # Configuration
│   └── formatters.js      # Data formatting
└── types/              # Type definitions
```

### Key Features
- **Event Listening**: Real-time contract event tracking
- **Error Handling**: Comprehensive error states and messaging
- **Loading States**: Smooth UX with loading indicators
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Data Persistence**: localStorage for transaction history

## 🔗 Smart Contracts

The dApp interacts with custom staking contracts deployed on Sepolia:
- **Staking Contract**: Handles deposits, withdrawals, and reward calculations
- **Token Contract**: ERC-20 token used for staking
- **Event System**: Tracks all user actions for transaction history

## 🛡️ Security Features

