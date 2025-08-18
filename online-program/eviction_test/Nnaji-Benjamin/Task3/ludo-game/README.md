# Sample Hardhat Project

### Contract address
```bash
0x3e3Fe69b1DFE92f9f52acAaFF47E1d68d2bF21f9
```
### token address
```bash
0xCAd9C70fD5d61Bd9eC1a4C480A9F5fc54b1a21CC
```

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

### Deploy contract
```bash
 npx hardhat run scripts/deploy.js --network sepolia
 ```

### verify token address
```bash
npx hardhat verify --network sepolia 0xCAd9C70fD5d61Bd9eC1a4C480A9F5fc54b1a21CC "MyToken" "MTK" "0xa5e0e78F6C625a461Ace47C28aEbeB03ed3f1107" "1000000"
```

### verify contract address
```bash
npx hardhat verify --network sepolia 0x3e3Fe69b1DFE92f9f52acAaFF47E1d68d2bF21f9 "0xCAd9C70fD5d61Bd9eC1a4C480A9F5fc54b1a21CC" "1000000000000000000"
```
### Etherscan sepolia
[Link](https://sepolia.etherscan.io/address/0x3e3Fe69b1DFE92f9f52acAaFF47E1d68d2bF21f9#code)
