import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
    console.log(" Deploying Lottery Smart Contract...\n");

    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    const Lottery = await ethers.getContractFactory("Lottery");
    console.log("\n Deploying contract...");
    
    const lottery = await Lottery.deploy();
    await lottery.waitForDeployment();
    
    const contractAddress = await lottery.getAddress();
    
    console.log(" Lottery contract deployed successfully!");
    console.log(" Contract Address:", contractAddress);
    
    console.log("\n Contract Information:");
    console.log("- Entry Fee:", ethers.formatEther(await lottery.ENTRY_FEE()), "ETH");
    console.log("- Max Players:", Number(await lottery.MAX_PLAYERS()));
    console.log("- Starting Round:", Number(await lottery.currentRound()));
    
    console.log("\n Contract deployed and ready for use!");
    console.log(" Save this address for verification and interaction:", contractAddress);
    
    return {
        contractAddress,
        contractName: "Lottery",
        network: hre.network.name,
        deployer: deployer.address
    };
}

main()
    .then((deploymentInfo) => {
        console.log("\n Deployment completed successfully!");
        console.log("Network:", deploymentInfo.network);
        console.log("Contract:", deploymentInfo.contractAddress);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n Deployment failed:");
        console.error(error);
        process.exit(1);
    });
