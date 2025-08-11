// // This setup uses Hardhat Ignition to manage smart contract deployments.
// // Learn more about it at https://hardhat.org/ignition

// import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const PiggyBankModule = buildModule("LockModule", (m) => {
  
//   const piggybank = m.contract("PiggyBank"
//   );

//   return { piggybank};
// });

// export default PiggyBankModule;

// 


import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankModule = buildModule("LockModule", (m) => {
  const [deployer] = m.getSigners();

  // Pass deployer.address as the _owner parameter
  const piggybank = m.contract("PiggyBank", [0xbb543fc7ee81bfd6880313e25740da711cafc14d]);

  return { piggybank };
});

export default PiggyBankModule;
