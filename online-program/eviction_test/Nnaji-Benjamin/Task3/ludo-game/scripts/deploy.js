async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy a mock token first
  const Token = await ethers.getContractFactory("ERC20Mock");
  const token = await Token.deploy(
    "Game Token",
    "GTK",
    deployer.address,
    ethers.parseEther("1000000")
  );
  await token.waitForDeployment();

  console.log("Token deployed to:", await token.getAddress());

  // Deploy LudoGame with stake amount of 10 tokens
  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(
    await token.getAddress(),
    ethers.parseEther("10")
  );
  await ludoGame.waitForDeployment();

  console.log("LudoGame deployed to:", await ludoGame.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
