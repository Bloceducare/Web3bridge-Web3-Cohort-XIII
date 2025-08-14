import { ethers, run } from "hardhat";

async function main() {
  const boxFee = ethers.parseEther("0.1");
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; 
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; 
  const subscriptionId = 1234567890n; 

  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBoxFactory.deploy(boxFee, vrfCoordinator, keyHash, subscriptionId);
  await lootBox.waitForDeployment();
  const lootBoxAddress = await lootBox.getAddress();
  console.log("LootBox deployed to:", lootBoxAddress);

  // Verify on Etherscan
  console.log("Verifying contract...");
  await run("verify:verify", {
    address: lootBoxAddress,
    constructorArguments: [boxFee, vrfCoordinator, keyHash, subscriptionId],
  });
  console.log("Verified! Check on https://sepolia.etherscan.io/address/" + lootBoxAddress);

  // Deploy mock tokens and add rewards (example)
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const erc20Mock = await ERC20Mock.deploy("TestERC20", "T20");
  await erc20Mock.waitForDeployment();
  await erc20Mock.mint(lootBoxAddress, 1000);
  console.log("ERC20Mock deployed to:", await erc20Mock.getAddress());

  const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
  const erc721Mock = await ERC721Mock.deploy("TestNFT", "TNFT");
  await erc721Mock.waitForDeployment();
  await erc721Mock.mint(lootBoxAddress, 1);
  console.log("ERC721Mock deployed to:", await erc721Mock.getAddress());

  const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
  const erc1155Mock = await ERC1155Mock.deploy("https://example.com/metadata/{id}.json");
  await erc1155Mock.waitForDeployment();
  await erc1155Mock.mint(lootBoxAddress, 1, 5, "0x");
  console.log("ERC1155Mock deployed to:", await erc1155Mock.getAddress());

  await lootBox.addReward(0, await erc20Mock.getAddress(), 100, 70);
  await lootBox.addReward(1, await erc721Mock.getAddress(), 1, 20);
  await lootBox.addReward(2, await erc1155Mock.getAddress(), 1, 10);
  console.log("Rewards added.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});