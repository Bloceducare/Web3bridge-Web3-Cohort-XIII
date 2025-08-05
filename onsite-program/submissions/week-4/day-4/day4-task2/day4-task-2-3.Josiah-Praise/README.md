# Solidity Smart Contract Projects

This repository contains two smart contract projects deployed on the Lisk Sepolia testnet, demonstrating efficient data management patterns.

### 1. School Management System

A smart contract for managing student records. It uses the student's wallet address as a unique identifier, allowing for efficient registration, updates, and status changes (e.g., Active, Deferred). The system is designed to handle a large number of students without incurring high gas costs for lookups or modifications.

*   **View on Lisk Sepolia Blockscout:**
    [0x938145eDA1f996F8Fb583844bE5A8098dA83F7B2](https://sepolia-blockscout.lisk.com/address/0x938145eDA1f996F8Fb583844bE5A8098dA83F7B2#code)

### 2. TodoList

An on-chain Todo List application that supports full CRUD (Create, Read, Update, Delete) functionality. The contract is optimized for gas efficiency by using a mapping for instant data lookups and an array of IDs for enumeration, making it scalable and cost-effective.

*   **View on Lisk Sepolia Blockscout:**
    [0x6Fe6940Aa7047D2bd3DF133B5e988DC914E7CabD](https://sepolia-blockscout.lisk.com/address/0x6Fe6940Aa7047D2bd3DF133B5e988DC914E7CabD#code)