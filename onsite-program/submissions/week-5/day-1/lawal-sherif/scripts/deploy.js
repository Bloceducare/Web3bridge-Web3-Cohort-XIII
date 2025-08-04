async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const ERC20 = await ethers.getContractFactory("ERC20");
  const maxSupply = ethers.parseUnits("1000000", 18); // 1M tokens
  const token = await ERC20.deploy(maxSupply);

  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
