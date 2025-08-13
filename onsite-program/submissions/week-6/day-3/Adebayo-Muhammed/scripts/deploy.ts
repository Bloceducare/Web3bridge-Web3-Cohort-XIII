// scripts/quickDeploy.ts
import { ethers } from "hardhat";

async function main() {
    console.log("Quick Deploy with Your Pinata Image...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    

    const imageCID = "bafkreiausplr4is6u2quqxddzpm5ihqq2j4ogyq2skk53eyleetzqnfsw4";
    const imageURI = `ipfs://${imageCID}`;
    
    console.log("Using image:", imageURI);
    

    console.log("Deploying DAOMemberNFT...");
    const DAOMemberNFT = await ethers.getContractFactory("DAOMemberNFT");
    const nft = await DAOMemberNFT.deploy(); 
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("DAOMemberNFT deployed to:", nftAddress);
    
    console.log("Deploying TokenGatedDAO...");
    const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
    const dao = await TokenGatedDAO.deploy(nftAddress);
    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();
    console.log("TokenGatedDAO deployed to:", daoAddress);
    
    const metadata = {
        name: "DAO Member #1",
        description: "Exclusive TokenGated DAO membership with governance rights",
        image: imageURI,
        attributes: [
            { trait_type: "Membership Level", value: "Founder" },
            { trait_type: "Voting Power", value: "High" },
            { trait_type: "Network", value: "Lisk" }
        ]
    };
    console.log("Minting NFT...");
    await nft.mint(deployer.address, 1);
    console.log("Minted NFT #1 to:", deployer.address);
    
    console.log("Setting up roles...");
    const voterRole = ethers.keccak256(ethers.toUtf8Bytes("VOTER"));
    const proposerRole = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER")); 
    const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));
    
    await nft.grantRole(1, voterRole, deployer.address, 0);
    await nft.grantRole(1, proposerRole, deployer.address, 0);
    await nft.grantRole(1, adminRole, deployer.address, 0);
    
    console.log("Granted VOTER, PROPOSER, and ADMIN roles");
    
    console.log("Quick deployment complete!");
    console.log("Summary:");
    console.log("   DAOMemberNFT:", nftAddress);
    console.log("   TokenGatedDAO:", daoAddress);
    console.log("   Your Image IPFS:", imageURI);
    console.log("   Gateway URL:", `https://indigo-effective-porpoise-546.mypinata.cloud/ipfs/${imageCID}`);
    
    console.log("To add full metadata:");
    console.log("   1. Upload this metadata JSON to Pinata:");
    console.log(JSON.stringify(metadata, null, 2));
    console.log(" 2. Then run:");
    console.log(`   await nft.setTokenURI(1, "ipfs://YOUR_METADATA_CID");`);
    
    console.log("Testing DAO functionality...");
    try {
        const proposalTx = await dao.createProposal("Test proposal with image NFT");
        await proposalTx.wait();
        console.log("Successfully created proposal - DAO is working!");
        
        const proposal = await dao.getProposal(1);
        console.log("Proposal details:", {
            id: proposal.id.toString(),
            description: proposal.description,
            proposer: proposal.proposer
        });
        
    } catch (error) {
        console.log("DAO test failed:", error.message);
    }
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});