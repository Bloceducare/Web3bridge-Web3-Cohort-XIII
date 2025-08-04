const hre = require("hardhat");

async function main() {
  const [deployer, owner1, owner2, owner3] = await hre.ethers.getSigners();

  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");

  const owners = [owner1.address, owner2.address, owner3.address];
  const requiredConfirmations = 2;

  const wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);

  await wallet.waitForDeployment();

  console.log("MultiSigWallet deployed to:", await wallet.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
