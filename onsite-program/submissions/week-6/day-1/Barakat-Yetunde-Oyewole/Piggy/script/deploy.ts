import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    const factory = await PiggyBankFactory.deploy();

    await factory.deployed();

    console.log("PiggyBankFactory deployed to:", factory.address);
    console.log("Factory admin:", await factory.admin());
    console.log("Deployer address:", deployer.address);

    const factoryStats = await factory.getFactoryStats();
    console.log("Factory Statistics:");
    console.log("Total Banks:", factoryStats.totalBanks.toString());
    console.log("Total Users:", factoryStats.totalUsers.toString());
    console.log("Factory Admin:", factoryStats.factoryAdmin);

    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        factoryAddress: factory.address,
        deployerAddress: deployer.address,
        adminAddress: await factory.admin(),
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString()
    };

    console.log("Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return {
        factory: factory.address,
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
