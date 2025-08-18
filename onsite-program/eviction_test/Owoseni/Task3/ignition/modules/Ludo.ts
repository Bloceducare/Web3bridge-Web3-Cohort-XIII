const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory("ERC20");
  const token = await Token.deploy("TestToken", "TST");
  await token.deployed();

  const LudoGame = await hre.ethers.getContractFactory("LudoGame");
  const ludo = await LudoGame.deploy(token.address);
  await ludo.deployed();

  console.log("Token deployed to:", token.address);
  console.log("LudoGame deployed to:", ludo.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});