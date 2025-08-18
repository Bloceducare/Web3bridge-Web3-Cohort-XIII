## Lottery Smart Contract

- Deploy: `npx hardhat run scripts/deploy.ts --network sepolia`
- Local test: `npx hardhat test`
- Interaction (local): `npx hardhat run scripts/interact.ts`

**Deployed Contract Address**: `0x32f66D8d0d85f58049dfF25B7029B405F83269A4`

**Network**: Sepolia Testnet

**Etherscan**: [Verified Contract](https://sepolia.etherscan.io/address/0x32f66D8d0d85f58049dfF25B7029B405F83269A4#code)

# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```
