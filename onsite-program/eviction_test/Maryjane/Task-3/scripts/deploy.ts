import { ethers } from "hardhat";

async function main() {
  console.log("Starting board game deployment");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  console.log("1. Deploying token contract");
  const TokenFactory = await ethers.getContractFactory("MaryjaneBoardGameToken");
  const gameToken = await TokenFactory.deploy();
  await gameToken.waitForDeployment();

  const tokenAddress = await gameToken.getAddress();
  console.log("Token deployed to:", tokenAddress);

  console.log("2. Deploying arena contract");
  const ArenaFactory = await ethers.getContractFactory("MaryjaneBoardGameArena");
  const gameArena = await ArenaFactory.deploy(tokenAddress);
  await gameArena.waitForDeployment();

  const arenaAddress = await gameArena.getAddress();
  console.log("Arena deployed to:", arenaAddress);

  console.log("3. Authorizing arena contract");
  const authorizeTx = await gameToken.approveGameContract(arenaAddress);
  await authorizeTx.wait();
  console.log("Arena contract authorized successfully");

  console.log("4. Verifying deployment");
  const tokenName = await gameToken.name();
  const tokenSymbol = await gameToken.symbol();
  const totalSupply = await gameToken.totalSupply();
  const stakeAmount = await gameToken.getRequiredStakeAmount();

  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply));
  console.log("Stake Amount:", ethers.formatEther(stakeAmount));

  const matchCount = await gameArena.getMatchCount();
  console.log("Initial Match Count:", matchCount.toString());

  console.log("Deployment completed successfully");
  console.log("Contract Addresses:");
  console.log("Token:", tokenAddress);
  console.log("Arena:", arenaAddress);

  console.log("Next Steps:");
  console.log("1. Participants need tokens to participate");
  console.log("2. Use createTokens() function to distribute tokens to participants");
  console.log("3. Participants must approve the arena contract to spend their tokens");
  console.log("4. Create matches using initializeMatch() function");
  console.log("5. Join matches using enterMatch() function");
  console.log("6. Make deposits using makeDeposit() function");
  console.log("7. Start playing when all participants have deposited");

  return {
    gameToken: tokenAddress,
    gameArena: arenaAddress
  };
}

main()
  .then(() => {
    console.log("All contracts deployed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
