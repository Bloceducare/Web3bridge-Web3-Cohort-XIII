import { network } from "hardhat";

const { ethers } = await network.connect({
    network: "lisk-sepolia",
    chainType: "op"
})

async function main() {
  const Lottery = await ethers.getContractFactory("Lottery");

  const lottery = await Lottery.deploy();
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log(`Lottery deployed to: ${contractAddress}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });