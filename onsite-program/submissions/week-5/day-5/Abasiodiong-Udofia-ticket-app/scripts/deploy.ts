import { ethers } from "hardhat";

async function main() {
  const TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
  const platform = await TicketingPlatform.deploy();

  await platform.waitForDeployment();
  console.log("TicketingPlatform deployed to:", await platform.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});