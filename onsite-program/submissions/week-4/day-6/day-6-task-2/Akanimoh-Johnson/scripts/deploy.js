const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const name = "Akan Nigeria";
  const symbol = "AKN";
  const decimals = 18;
  const initialSupply = hre.ethers.parseUnits("1000000", decimals);

  const erc20 = await ERC20.deploy(name, symbol, decimals, initialSupply);
  await erc20.waitForDeployment();

  console.log("ERC20 deployed to:", await erc20.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});