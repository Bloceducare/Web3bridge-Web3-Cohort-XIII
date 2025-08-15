import { ethers } from "hardhat";

async function main() {
const ClockSVG = await ethers.getContractFactory("ClockSVG");

  console.log("Deploying ClockSVG...");
  const clock = await ClockSVG.deploy();
  await clock.waitForDeployment();

  const clockAddress = await clock.getAddress();
  console.log(`ClockSVG deployed to: ${clockAddress}`);


  const [deployer] = await ethers.getSigners();
  const tx = await clock.mint(deployer.address);
  await tx.wait();

  console.log(`Minted token #1 to ${deployer.address}`);

 const tokenUri = await clock.tokenURI(1);
  console.log(`TokenURI for #1:\n${tokenUri}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
