const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting NFT deployment on Lisk Testnet...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "LSK");

    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low balance. You might need more LSK for deployment and gas fees.");
    }

    // Contract parameters
    const contractName = process.env.CONTRACT_NAME || "SimpleNFT";
    const contractSymbol = process.env.CONTRACT_SYMBOL || "SNFT";
    const baseURI = process.env.BASE_URI || "https://api.example.com/metadata/";

    console.log("📄 Contract details:");
    console.log("   Name:", contractName);
    console.log("   Symbol:", contractSymbol);
    console.log("   Base URI:", baseURI);

    // Deploy the contract
    const SimpleNFT = await ethers.getContractFactory("MartinsNFT");

    console.log("⏳ Deploying contract...");
    const simpleNFT = await SimpleNFT.deploy(contractName, contractSymbol, baseURI);

    await simpleNFT.waitForDeployment();
    const contractAddress = await simpleNFT.getAddress();

    console.log("✅ SimpleNFT deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("🔗 Explorer:", `https://sepolia-blockscout.lisk.com/address/${contractAddress}`);

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const totalSupply = await simpleNFT.totalSupply();
    const mintPrice = await simpleNFT.mintPrice();
    const maxSupply = await simpleNFT.MAX_SUPPLY();

    console.log("📊 Contract info:");
    console.log("   Total Supply:", totalSupply.toString());
    console.log("   Mint Price:", ethers.formatEther(mintPrice), "LSK");
    console.log("   Max Supply:", maxSupply.toString());

    // Save deployment info
    const deploymentInfo = {
        network: "lisk-testnet",
        contractAddress: contractAddress,
        contractName: contractName,
        contractSymbol: contractSymbol,
        baseURI: baseURI,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
    };

    console.log("\n📝 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 Deployment completed successfully!");
    console.log("💡 Next steps:");
    console.log("   1. Save the contract address for minting");
    console.log("   2. Fund the contract deployer for minting operations");
    console.log("   3. Use the mint script to create your first NFT");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });