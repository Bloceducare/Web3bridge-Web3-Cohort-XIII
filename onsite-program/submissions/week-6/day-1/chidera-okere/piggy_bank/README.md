# 🐷 Piggy Bank Factory

A smart contract system that allows users to create and manage multiple savings accounts with **ETH** or **ERC20 tokens**, customizable lock periods, and early withdrawal penalties.

---

## ✨ Features

- 🏦 **Multiple Savings Accounts** – Users can create several Piggy Banks (child contracts) from one factory.
- 💰 **Supports ETH & ERC20** – Choose your savings currency.
- ⏳ **Custom Lock Periods** – Each Piggy Bank can have a unique lock period.
- ⚠ **Early Withdrawal Penalty** – 3% fee for withdrawing before lock period ends (goes to factory deployer/admin).
- 📊 **Tracking** –
  - Number of Piggy Banks per user
  - Lock period per Piggy Bank
  - Balance per user per Piggy Bank

---

## 🚀 Deployment Details

- **Network:** Lisk Testnet (`4202`)
- **Factory Contract Address:** `0x038432D9d02C2883853C3d50131D99b5347D15Ab`
- **Deployment Tool:** Hardhat Ignition

---

## 📦 Deployment Command

```bash
npx hardhat ignition deploy ignition/modules/Piggy.ts \
  --network liskTestnet \
  --deployment-id sepolia-deployment
```
