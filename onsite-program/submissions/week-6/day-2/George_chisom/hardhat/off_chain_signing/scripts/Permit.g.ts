import { ethers } from "hardhat";

async function main() {
  const SwapPermit = await ethers.getContractFactory("swapPermit");

  const swapPermit = await SwapPermit.deploy();
  await swapPermit.waitForDeployment();

  const address: string = await swapPermit.getAddress();
  console.log("swapPermit deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
