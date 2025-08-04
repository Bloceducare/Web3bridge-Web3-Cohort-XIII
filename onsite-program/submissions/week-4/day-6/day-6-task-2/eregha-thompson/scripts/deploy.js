const hre = require("hardhat");

async function main() {
  const ERC20 = await hre.ethers.getContractFactory("ERC20");

  // Deploy with constructor arguments
  const token = await ERC20.deploy("GODBRAND", "GOD", 8);

  await token.waitForDeployment();


  console.log("Token deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
