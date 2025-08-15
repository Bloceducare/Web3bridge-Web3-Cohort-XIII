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


1
  Executed StakingModule#TokenA
  Executed StakingModule#TokenB

Batch #2
  Executed StakingModule#StakingContract

Batch #3
  Executed StakingModule#StakingContract._setStakingContract

[ StakingModule ] successfully deployed 🚀

Deployed Addresses

StakingModule#TokenA - 0x6D153b812e191FcBA26A8f5eC085363B66Bb8B77
StakingModule#TokenB - 0x6cd2E8c68e357008FDaDF77c4cA90b5C98B214F0
StakingModule#StakingContract - 0x40CfF10C77564cBA105A3133185CA7Cb08407dB0

Verifying deployed contracts

Verifying contract "contracts/TokenA.sol:TokenA" for network lisk-sepolia...
Successfully verified contract "contracts/TokenA.sol:TokenA" for network lisk-sepolia:
  - https://sepolia-blockscout.lisk.com/address/0x6D153b812e191FcBA26A8f5eC085363B66Bb8B77#code

Verifying contract "contracts/TokenB.sol:TokenB" for network lisk-sepolia...
Successfully verified contract "contracts/TokenB.sol:TokenB" for network lisk-sepolia:
  - https://sepolia-blockscout.lisk.com/address/0x6cd2E8c68e357008FDaDF77c4cA90b5C98B214F0#code

Verifying contract "contracts/StakingContract.sol:StakingContract" for network lisk-sepolia...
Successfully verified contract "contracts/StakingContract.sol:StakingContract" for network lisk-sepolia:
  - https://sepolia-blockscout.lisk.com/address/0x40CfF10C77564cBA105A3133185CA7Cb08407dB0#code