import { ethers } from "hardhat";

async function main() {
  console.log("Starting Ludo Game deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy LudoToken contract
  console.log("\n1. Deploying LudoToken contract...");
  const LudoTokenFactory = await ethers.getContractFactory("LudoToken");
  const ludoToken = await LudoTokenFactory.deploy();
  await ludoToken.waitForDeployment();
  
  const ludoTokenAddress = await ludoToken.getAddress();
  console.log("LudoToken deployed to:", ludoTokenAddress);

  // Deploy LudoGame contract
  console.log("\n2. Deploying LudoGame contract...");
  const LudoGameFactory = await ethers.getContractFactory("LudoGame");
  const ludoGame = await LudoGameFactory.deploy(ludoTokenAddress);
  await ludoGame.waitForDeployment();
  
  const ludoGameAddress = await ludoGame.getAddress();
  console.log("LudoGame deployed to:", ludoGameAddress);

  // Authorize the game contract to transfer tokens
  console.log("\n3. Authorizing game contract...");
  const authorizeTx = await ludoToken.authorizeGame(ludoGameAddress);
  await authorizeTx.wait();
  console.log("Game contract authorized successfully");

  // Verify token details
  console.log("\n4. Verifying deployment...");
  const tokenName = await ludoToken.name();
  const tokenSymbol = await ludoToken.symbol();
  const totalSupply = await ludoToken.totalSupply();
  const stakeAmount = await ludoToken.getGameStakeAmount();
  
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply));
  console.log("Stake Amount:", ethers.formatEther(stakeAmount));

  // Get game counter
  const gameCount = await ludoGame.getGameCount();
  console.log("Initial Game Count:", gameCount.toString());

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("LudoToken:", ludoTokenAddress);
  console.log("LudoGame:", ludoGameAddress);

  console.log("\n🎮 Next Steps:");
  console.log("1. Players need LUDO tokens to participate");
  console.log("2. Use mintTokens() function to distribute tokens to players");
  console.log("3. Players must approve the game contract to spend their tokens");
  console.log("4. Create games using createGame() function");
  console.log("5. Join games using joinGame() function");
  console.log("6. Stake tokens using stakeTokens() function");
  console.log("7. Start playing when all players have staked!");

  return {
    ludoToken: ludoTokenAddress,
    ludoGame: ludoGameAddress
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((addresses) => {
    console.log("\n🎉 All contracts deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
