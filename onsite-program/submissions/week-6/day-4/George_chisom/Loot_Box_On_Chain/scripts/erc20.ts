import { network } from "hardhat";
const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  const initialSupply = ethers.parseUnits("1000", 18); // 1000 tokens with 18 decimals

  // Get the contract factory for GLDToken
  const LootBoxToken = await ethers.getContractFactory("LootBoxERC20Token");

  // Deploy the contract
  const lootBoxToken = await LootBoxToken.deploy(initialSupply);

  // Wait for deployment to be mined
  await lootBoxToken.waitForDeployment();

  console.log(
    "LootBokERC20Token deployed at:",
    await lootBoxToken.getAddress()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
