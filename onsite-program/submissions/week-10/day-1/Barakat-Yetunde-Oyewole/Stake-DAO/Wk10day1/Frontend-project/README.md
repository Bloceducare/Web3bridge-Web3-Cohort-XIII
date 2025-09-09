# 🚀 Staking DApp - Web3 Frontend Task

A complete frontend application for interacting with a staking smart contract on Sepolia testnet, built with React, ethers.js, Tailwind CSS, and RainbowKit.

## ✅ **Task Requirements Completed**

### **User Interface Features**
- 🔐 **Wallet Connection** - RainbowKit integration with multiple wallet support
- 💰 **Staking Form** - Amount input with approve & stake flow
- 🏦 **Withdrawal Interface** - Normal and emergency withdrawal options
- 🎁 **Rewards Claim Section** - Claim accumulated rewards
- 📊 **All Stake Positions** - Complete overview of user's stakes
- 📈 **Individual Stake Details** - Detailed view of each stake position

### **Data Display Features**
- 📊 **Current Staking Position** - Real-time stake amounts and status
- 💎 **Pending Rewards** - Live reward calculations
- ⏰ **Time Until Unlock** - Countdown timers for locked stakes
- 📈 **Current APR** - Dynamic APR based on protocol state
- 🌐 **Total Protocol Statistics** - TVL, reward rates, protocol-wide APR

### **Smart Contract Integration**
- ✅ `stake()` - Stake tokens with ERC20 approval flow
- ✅ `withdraw()` - Withdraw unlocked stakes
- ✅ `claimRewards()` - Claim accumulated rewards
- ✅ `emergencyWithdraw()` - Emergency withdrawal with penalty

### **Data Retrieval Functions**
- 📋 `getUserStakes()` - Fetch user's staking positions
- 💰 `getPendingRewards()` - Get claimable rewards
- 🔒 `balanceOf()` - Token balance queries
- 📊 `totalStaked()` - Protocol-wide statistics
- ⚡ `currentRewardRate()` - Dynamic reward calculations

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v16 or higher)
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Sepolia ETH for gas fees

### **Installation & Setup**
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Application**
   - Visit `http://localhost:5173` (or the port shown in terminal)

### **Usage Instructions**

1. **Connect Wallet**
   - Click "Connect Wallet" in the header
   - Select your preferred wallet
   - Switch to Sepolia network if prompted

2. **Get Test Tokens**
   - Click "Get 50K Tokens" in the green banner
   - Confirm the transaction in your wallet
   - Your balance will update automatically

3. **Stake Tokens**
   - Enter the amount you want to stake
   - Click "Approve & Stake" (2-step process)
   - Your stake appears in "Your Stakes" section

4. **Monitor & Claim Rewards**
   - Watch pending rewards accumulate
   - Click "Claim Rewards" to harvest

5. **Withdraw Stakes**
   - Wait for unlock period (1 day minimum)
   - Click "Withdraw" for unlocked stakes
   - Use "Emergency Withdraw" if urgent (50% penalty)

## 🔧 **Smart Contract Details**

- **Staking Contract**: `0x21d92A7cA177d4bCCB5455003E15F340075A2653`
- **Mock ERC20 Token**: `0x7f1E19bC8B08F2158D4012c509D51022D9b994eb`
- **Network**: Sepolia Testnet (Chain ID: 11155111)

## ✅ **All Requirements Implemented**

**User Interface**: ✅ Wallet connection, staking form, withdrawal interface, rewards section, emergency withdrawal, stake displays

**Data Display**: ✅ Current positions, pending rewards, unlock timers, APR calculations, protocol statistics

**Contract Integration**: ✅ All functions (stake, withdraw, claimRewards, emergencyWithdraw) with proper error handling

**Tech Stack**: ✅ React + ethers.js + Tailwind CSS + RainbowKit with professional code organization

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
