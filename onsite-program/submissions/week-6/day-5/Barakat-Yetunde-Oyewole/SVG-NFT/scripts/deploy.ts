import hre from "hardhat";

async function main() {
  const TimeNFT = await hre.ethers.getContractFactory("TimeNFT");
  const timeNFT = await TimeNFT.deploy();

  await timeNFT.waitForDeployment();

  const contractAddress = await timeNFT.getAddress();
  console.log("TimeNFT deployed to:", contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  await timeNFT.mint(deployer.address);
  console.log("Minted token #0 to deployer");

  const tokenURI = await timeNFT.tokenURI(0);
  console.log("Token URI:", tokenURI);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
