# Multi-Signature Wallet Smart Contract

This project is a decentralized Multi-Signature (Multi-Sig) Wallet built on Solidity. It provides a secure way for a group of owners to collectively manage digital assets, requiring multiple approvals before any transaction can be executed.

## Core Concepts & Workflow

The wallet operates on a simple but powerful principle: no single individual has unilateral control over the funds. Every transaction must be proposed, approved by a predefined number of co-owners, and then executed.

### Key Features

1.  **Shared Ownership:** The wallet is initialized with a list of owner addresses and a "confirmation threshold." For example, a wallet might have 3 owners and require 2 of them to approve any transaction. This configuration is immutable and set upon deployment.

2.  **Transaction Proposals:** Only designated owners can submit a new transaction proposal. A proposal consists of sending a specific amount of Ether to a destination address. This prevents spam and ensures all proposals are legitimate considerations for the owners.

3.  **Approval Mechanism:** Owners can review and approve pending proposals. The contract tracks each owner's approval for every transaction, ensuring an owner cannot approve the same proposal more than once.

4.  **Secure Execution:** Once a proposal has gathered enough approvals to meet the confirmation threshold, it can be executed. This step is intentionally made public, allowing any account (including a third-party automation service) to trigger the execution, which sends the Ether to its final destination. The execution logic is protected against re-entrancy attacks by following the Checks-Effects-Interactions pattern.

## View on Lisk Sepolia

The verified source code for this project is deployed on the Lisk Sepolia testnet and can be viewed on the Blockscout explorer.

*   **[Multi-Sig Wallet Instance](https://sepolia-blockscout.lisk.com/address/0x8016690439F3a35FE80ee526f5917f397a0d50eA)**
*   **[Factory Contract](https://sepolia-blockscout.lisk.com/address/0xb4F8d7712e4a4752Be3bb6Fc6c77eeeE64e32665)**

## Disclaimer

This is a portfolio project created for learning and demonstration purposes. It has not undergone a formal security audit. Please do not use it in a production environment with real funds without professional review.