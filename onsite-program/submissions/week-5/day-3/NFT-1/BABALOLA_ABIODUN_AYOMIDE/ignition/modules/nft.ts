import hre from "hardhat";

async function main() {
    const MyNFT = await hre.ethers.getContractFactory("AbbeyNft");
    const myNFT = await MyNFT.deploy();
    const nft = await myNFT.waitForDeployment();
    console.log(nft.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});