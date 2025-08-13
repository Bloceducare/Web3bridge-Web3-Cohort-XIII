import { ethers, run } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("🚀 Starting EventContract deployment and verification...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.005")) {
    throw new Error("Insufficient balance for deployment");
  }

  const baseURI = "ipfs://QmfE733vdAm7V3WQVQrE24yddUJvBYs4FAtLuaK5AsvZyz/";
  
  console.log("\n📦 Deploying EventContract...");
  const EventContract = await ethers.getContractFactory("EventContract");
  
  // Optimize gas settings for deployment
  const eventContract = await EventContract.deploy(baseURI, {
    gasLimit: 3000000, // Reduced gas limit
    gasPrice: ethers.parseUnits("1", "gwei") // Lower gas price
  });
  
  console.log("⏳ Waiting for deployment confirmation...");
  await eventContract.waitForDeployment();
  
  const contractAddress = await eventContract.getAddress();
  console.log(`✅ EventContract deployed to: ${contractAddress}`);

  const deploymentInfo = {
    contractAddress,
    network: "lisk-sepolia",
    deployer: deployer.address,
    baseURI,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [baseURI],
    gasUsed: (await eventContract.deploymentTransaction()?.gasLimit || 0).toString()
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to deployment-info.json");

  console.log("\n🔍 Verifying contract on Etherscan...");
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [baseURI],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.log("⚠️  Verification failed (this is normal for some networks):");
    console.log(error);
  }

  console.log("\n🎯 Deployment and verification completed!");
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Network: lisk-sepolia`);
  console.log(`Explorer: https://sepolia-blockscout.lisk.com/address/${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 