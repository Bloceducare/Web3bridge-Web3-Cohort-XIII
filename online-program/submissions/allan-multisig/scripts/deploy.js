const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying from:", deployer.address);

  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const multisig = await MultiSigWallet.deploy(
    ["0xAA6E05A031f9EE46311A61d3C65a646f7392b4fa", "0x2eC6be1A02b8697367f95082e94c3789b917E22A", "0x4B359D10c05b8615B437AA76bD4A5aEef4FdDE9F"], // Replace with actual owner addresses
    2 // confirmationsRequired
  );

  await multisig.waitForDeployment();

  console.log("MultiSigWallet deployed to:", await multisig.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
