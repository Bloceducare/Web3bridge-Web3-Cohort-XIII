# TESTING SUCCESSFUL
=======
> solidity-coverage: v0.8.16

Instrumenting for coverage...
=============================

> DAO.sol
> interfaces\IERC7432.sol
> MembershipNFT.sol
> Roles.sol

Compilation:
============

Generating typings for: 1 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 6 typings!
Compiled 4 Solidity files successfully (evm target: paris).

Network Info
============
> HardhatEVM: v2.26.3
> network:    hardhat



  Lock
    Deployment
      ✔ Should set the right unlockTime (65ms)
      ✔ Should set the right owner
      ✔ Should receive and store the funds to lock
      ✔ Should fail if the unlockTime is not in the future
    Withdrawals
      Validations
        ✔ Should revert with the right error if called too soon
        ✔ Should revert with the right error if called from another account
        ✔ Shouldn't fail if the unlockTime has arrived and the owner calls it
      Events
        ✔ Should emit an event on withdrawals
      Transfers
        ✔ Should transfer the funds to the owner


  9 passing (147ms)

-----------------------|----------|----------|----------|----------|----------------|
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-----------------------|----------|----------|----------|----------|----------------|
 contracts\            |      100 |      100 |      100 |      100 |                |
  DAO.sol              |      100 |      100 |      100 |      100 |                |
  MembershipNFT.sol    |      100 |      100 |      100 |      100 |                |
  Roles.sol            |      100 |      100 |      100 |      100 |                |
 contracts\interfaces\ |      100 |      100 |      100 |      100 |                |
  IERC7432.sol         |      100 |      100 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|
All files              |      100 |      100 |      100 |      100 |                |
-----------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json



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
