const hre = require("hardhat");

async function main() {
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(); // waits for deployment automatically

  console.log("MyNFT deployed to:", myNFT.target); // use `target` instead of `address` in latest ethers
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
