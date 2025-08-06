import hre from "hardhat";

async function main() {
  const MyCryptoLions = await hre.ethers.getContractFactory("MyTestNFT");
  const myTestNFT = await MyCryptoLions.deploy("MyTestNFT", "MTN");

  await myTestNFT.waitForDeployment();

  // Get the contract address
  const contractAddress = await myTestNFT.getAddress();
  console.log("myTestNFT deployed to:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
