const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with:", deployer.address);

    // Deploy ERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const erc20 = await MockERC20.deploy("Mock Token", "MTK", ethers.utils.parseEther("1000"));
    await erc20.deployed();
    console.log("ERC20 deployed to:", erc20.address);

    // Deploy ERC721
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const erc721 = await MockERC721.deploy("Mock NFT", "MNFT");
    await erc721.deployed();
    console.log("ERC721 deployed to:", erc721.address);

    // // Deploy ERC1155
    // const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    // const erc1155 = await MockERC1155.deploy();
    // await erc1155.deployed();
    // console.log("ERC1155 deployed to:", erc1155.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});