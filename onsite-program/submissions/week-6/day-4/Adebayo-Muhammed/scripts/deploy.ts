import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying LootBox...");
  console.log("Deployer:", deployer.address);
  
  const boxPrice = ethers.parseEther("0.01");
  
  const LootBox = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBox.deploy("1", boxPrice);
  
  
  console.log("LootBox deployed to:", await lootBox.getAddress());
  console.log("Box price:", ethers.formatEther(boxPrice), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });