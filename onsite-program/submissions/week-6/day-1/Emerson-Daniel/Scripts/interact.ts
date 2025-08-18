import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Replace with your deployed factory address
  const factoryAddress = "0xYourDeployedFactoryAddress";
  const factory = await ethers.getContractAt("PiggyBankFactory", factoryAddress);

  // Example: Create a piggy bank
  const tx = await factory.createPiggyBank(3600); // 1 hour lock
  await tx.wait();
  console.log("Piggy bank created");

  // Example: Get user piggy banks
  const user = await ethers.getSigners().then(signers => signers[0].address);
  const banks = await factory.getUserPiggyBanks(user);
  console.log("User piggy banks:", banks);

  // If you have a piggy bank address, interact like:
  // const piggy = await ethers.getContractAt("IPiggyBank", banks[0]);
  // await piggy.deposit("0x0000000000000000000000000000000000000000", ethers.parseEther("1.0"), { value: ethers.parseEther("1.0") });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});