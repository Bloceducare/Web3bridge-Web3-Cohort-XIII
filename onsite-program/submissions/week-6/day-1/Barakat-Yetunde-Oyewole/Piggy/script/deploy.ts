import { ethers, run, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("PiggyBankFactory deployed to:", factoryAddress);
  console.log("Factory admin:", await factory.admin());
  console.log("Deployer address:", deployer.address);

  const factoryStats = await factory.getFactoryStats();
  console.log("Factory Statistics:");
  console.log("Total Banks:", factoryStats.totalBanks.toString());
  console.log("Total Users:", factoryStats.totalUsers.toString());
  console.log("Factory Admin:", factoryStats.factoryAdmin);

  const networkData = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: networkData.name,
    factoryAddress: factoryAddress,
    deployerAddress: deployer.address,
    adminAddress: await factory.admin(),
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString()
  };

  console.log("Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  
  // VERIFY ON ETHERSCAN
  
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`\nVerifying contract on ${network.name}...`);
    try {
      await run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [] 
      });
      console.log("Contract verified successfully!");
    } catch (err: any) {
      if (err.message.toLowerCase().includes("already verified")) {
        console.log(" is already verified!");
      } else {
        console.error("Verification failed:", err);
      }
    }
  } else {
    console.log("Skipping verification on local network.");
  }

  return {
    factory: factoryAddress,
    deployer: deployer.address
  };
}

main()
  .then((deploymentResult) => {
    console.log("Deployment successful:", deploymentResult);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });