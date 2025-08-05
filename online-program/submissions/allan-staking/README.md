# 🪙 Staking Contract – Solidity Assignment (Web3Bridge Cohort XIII)

## 🧾 Description

This smart contract system implements a **staking mechanism** where users can stake a mock ERC20 token (TokenA) and receive a reward token (TokenB) after a locking period. The contract ensures safe staking, proper minting of rewards, and controlled unstaking based on lock durations.

## ⚙️ Features

| Feature                               | Status |
|---------------------------------------|--------|
| Stake TokenA to earn TokenB           | ✅ Implemented |
| Unstake after a lock period           | ✅ Implemented |
| Lock time enforcement                 | ✅ Implemented |
| Mint reward token (TokenB) on stake   | ✅ Implemented |
| Handle zero or invalid stake/unstake  | ✅ Implemented |
| Unit tests with positive & negative cases | ✅ Implemented |

## 📜 Events

| Event Signature |
|-----------------|
| `event Staked(address indexed user, uint amount);` |
| `event Unstaked(address indexed user, uint amount);` |

---

## ✅ Results

### 🧪 Test Suite Results

| Test Suite         | Test Description                                        | Status |
|--------------------|---------------------------------------------------------|--------|
| `Stake`            | Should allow user to stake and mint TokenB              | ✅ Pass |
|                    | Should revert for zero stake                            | ✅ Pass |
| `Unstake`          | Should revert if trying to unstake before unlock time   | ✅ Pass |
|                    | Should allow unstake after lock period                  | ✅ Pass |
|                    | Should revert if user tries to unstake more than staked | ✅ Pass |
| **Total**          | 5 passing                                                | 🟢 All tests passed (334ms) |

> **Note:** All assignment-stated test cases were fully covered.

---

## ⚒️ Solidity & Network Configuration

| Parameter             | Value           |
|-----------------------|-----------------|
| Solidity Version      | 0.8.20          |
| Optimizer             | false           |
| Optimizer Runs        | 200             |
| viaIR                 | false           |
| Block Gas Limit       | 30,000,000 gas  |
| Network               | Lisk Sepolia    |

---

## ⛽ Gas Usage Per Method

| Contract | Method   | Avg Gas Used | Calls |
|----------|----------|--------------|-------|
| Staking  | `stake`  | 136,647      | 5     |
| Staking  | `unstake`| 69,325       | 1     |
| TokenA   | `approve`| 46,964       | 4     |
| TokenA   | `transfer`| 52,222      | 5     |
| TokenB   | `approve`| 46,964       | 1     |

---

## 🚀 Deployment Gas Usage

| Contract | Avg Gas Used | % of Block Limit |
|----------|--------------|------------------|
| Staking  | 723,057      | 2.4%             |
| TokenA   | 964,152      | 3.2%             |
| TokenB   | 1,042,576    | 3.5%             |

---

## 🧪 Toolchain

| Component         | Tool       |
|-------------------|------------|
| Framework         | Hardhat    |
| Test Runner       | Mocha      |
| Assertion Library | Chai       |

---

## 📌 Notes

✅ All contract features required by the assignment have been implemented and tested successfully.

📁 Contracts:
- `TokenAandB.sol`: Contains mock ERC20 TokenA and TokenB.
- `Staking.sol`: Main staking logic and token reward mechanics.
- `StakeLib.sol`: Shared logic used by `Staking.sol`.

🧪 You may run tests locally using:
```bash
npx hardhat 
```
## Author

#### Allan Robinson -- Web3Bridge Cohort XIII


---

### ✅ Assignment Completion Checklist

Here’s how you did based on the original **assignment goals**:

| Requirement                                 | Covered? | Location                  |
|---------------------------------------------|----------|---------------------------|
| Stake TokenA                                | ✅ Yes   | `Staking.sol`             |
| Mint TokenB on stake                        | ✅ Yes   | `Staking.sol`             |
| Enforce lock time                           | ✅ Yes   | `Staking.sol`             |
| Unstake only after lock                     | ✅ Yes   | `Staking.sol`             |
| Prevent early or excess unstaking           | ✅ Yes   | `Staking.sol`             |
| Emit events                                 | ✅ Yes   | `Staked`, `Unstaked`      |
| Unit tests for all conditions               | ✅ Yes   | `test/Staking.js`         |

