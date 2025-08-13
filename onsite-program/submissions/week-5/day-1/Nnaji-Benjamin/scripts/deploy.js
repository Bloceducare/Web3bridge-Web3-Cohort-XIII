const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const owners = [
    deployer.address,
    "0x4d06ae33Fc90144B7f41F05E618f332Dbf98D99A",
  ];
  const requiredConfirmations = 2;

  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);

  await wallet.waitForDeployment();
  const contractAddress = await wallet.getAddress();

  console.log(`MultiSigWallet deployed to: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
