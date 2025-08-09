# MultiSig Wallet – Solidity Assignment (Web3Bridge Cohort XIII)

## 🧾 Description
A smart contract that implements a multi-signature wallet. Multiple owners must approve transactions before they are executed.

## ⚙️ Features
- Submit transaction (destination, value, data)
- Confirm/revoke confirmations
- Execute when threshold is met
- Accept ETH deposits
- Emit events for each major action

## 📜 Events
```solidity
event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value);
event TransactionConfirmed(uint256 indexed txId, address indexed owner);
event TransactionRevoked(uint256 indexed txId, address indexed owner);
event TransactionExecuted(uint256 indexed txId);
```

### Results 


| Test Suite       | Test Description                                              | Status                |
| ---------------- | ------------------------------------------------------------- | --------------------- |
| `MultiSigWallet` |                                                               |                       |
|                  | Should set owners and required confirmations correctly        | ✅ Pass                |
|                  | Should allow owner to submit a transaction                    | ✅ Pass                |
|                  | Should allow confirmations and execute after enough approvals | ✅ Pass                |
|                  | Should revert execution without enough confirmations          | ✅ Pass                |
|                  | Should allow revoking confirmation                            | ✅ Pass                |
|                  | Should reject actions from non-owners                         | ✅ Pass                |
|                  | **Total**                                                     | **6 passing (157ms)** |

### Solidity & Network Configuration

| Parameter            | Value          |
| -------------------- | -------------- |
| **Solidity Version** | 0.8.20         |
| **Optimizer**        | false          |
| **Optimizer Runs**   | 200            |
| **viaIR**            | false          |
| **Block Gas Limit**  | 30,000,000 gas |


### Gas Usage Per Method

| Contract       | Method               | Min Gas | Max Gas | Avg Gas | Calls |
| -------------- | -------------------- | ------- | ------- | ------- | ----- |
| MultiSigWallet | `confirmTransaction` | 57,990  | 75,090  | 70,815  | 4     |
| MultiSigWallet | `executeTransaction` | -       | -       | 70,374  | 2     |
| MultiSigWallet | `revokeConfirmation` | -       | -       | 32,689  | 1     |
| MultiSigWallet | `submitTransaction`  | -       | -       | 101,483 | 6     |


### Deployment Gas Usage

| Contract       | Deployment Gas | % of Block Limit |
| -------------- | -------------- | ---------------- |
| MultiSigWallet | 1,727,145      | 5.8%             |


### Toolchain

Framework: Hardhat

Test Runner: Mocha

Assertion Library: Chai