// // scripts/deployFactoryAndCreateBank.ts
// import { ethers } from "hardhat";

// async function main() {
//   const [deployer, user] = await ethers.getSigners();
//   console.log("Deployer:", deployer.address);
//   console.log("User (will receive a PiggyBank):", user.address);

//   // 1) Deploy the PiggyBankFactory (no constructor args)
//   const Factory = await ethers.getContractFactory("PiggyBankFactory");
//   const factory = await Factory.deploy();            // <-- no args
//   await factory.waitForDeployment();
//   console.log("Factory deployed at:", await factory.getAddress());

//   // 2) Use the factory to create a PiggyBank for `user`
//   // createPiggyBank() uses msg.sender inside the factory; call it from the user
//   const tx = await factory.connect(user).createPiggyBank();
//   const receipt = await tx.wait();
//   console.log("createPiggyBank tx:", receipt.transactionHash);

//   // 3) Get the created PiggyBank address from the public mapping:
//   const bankAddress = await factory.userPiggyBanks(user.address, 0);
//   console.log("New PiggyBank address for user:", bankAddress);

//   // 4) Optional: attach to the PiggyBank contract and call a method (example: createSavingsAccount)
//   const PiggyBank = await ethers.getContractFactory("PiggyBank");
//   const pig = await PiggyBank.attach(bankAddress);
//   const createAccTx = await pig.connect(user).createSavingsAccount(60); // lockPeriod = 60s
//   await createAccTx.wait();
//   console.log("Created savings account in PiggyBank");
// }

// main().catch((err) => {
//   console.error(err);
//   process.exitCode = 1;
// });




import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // 1️⃣ Deploy contract
  const PiggyBank = await ethers.getContractFactory("PiggyBank");

  // Pass constructor parameter here
  const piggyBank = await PiggyBank.deploy(deployer.address);

  // Wait for deployment
  await piggyBank.waitForDeployment();

  const deployedAddress = await piggyBank.getAddress();
  console.log("✅ PiggyBank deployed at:", deployedAddress);

  // 2️⃣ Wait a few seconds so Lisk block explorer picks it up
  console.log("⏳ Waiting for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // wait 30s

  // 3️⃣ Verify contract
  console.log("🔍 Verifying contract...");
  await run("verify:verify", {
    address: deployedAddress,
    constructorArguments: [deployer.address],
  });

  console.log("🎉 Verification complete!");
}

main().catch((error) => {
  console.error("❌ Deployment/verification failed:", error);
  process.exitCode = 1;
});
