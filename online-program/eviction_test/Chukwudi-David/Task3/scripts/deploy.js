const { ethers } = require("hardhat");

async function main() {

  const stakeAmount = ethers.parseEther("10");
  const goalPosition = 10;
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  
  console.log("Token deployed to:", ludoGame.target);

  const LudoGame = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGame.deploy(token.target, stakeAmount, goalPosition, 22);

  console.log("Ludo Game deployed to:", ludoGame.target);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
