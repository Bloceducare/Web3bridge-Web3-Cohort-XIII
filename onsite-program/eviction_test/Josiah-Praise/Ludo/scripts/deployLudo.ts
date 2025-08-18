import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());
  const Ludo = await ethers.getContractFactory("Ludo");
  const ludo = await Ludo.deploy(
    await token.getAddress(),
    ethers.parseEther("10")
  );
  await ludo.waitForDeployment();
  console.log("Ludo deployed to:", await ludo.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
