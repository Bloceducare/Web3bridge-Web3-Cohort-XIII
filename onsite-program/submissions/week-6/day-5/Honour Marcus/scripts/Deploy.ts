import { ethers } from "hardhat";

async function main() {
    const [owner] = await ethers.getSigners();

    console.log("Deploying with account:", owner.address);

    const Contract = await ethers.getContractFactory("DynamicTimeSvgNFT");
    const nft = await Contract.deploy();
    await nft.waitForDeployment();

    const address = await nft.getAddress();
    console.log("NFT deployed to:", address);

    const tx = await nft.mint(owner.address);
    await tx.wait();
    console.log(`Minted token #1 to: ${owner.address}`);

    
    const tokenUri = await nft.tokenURI(1);
    console.log("Token URI:", tokenUri);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
