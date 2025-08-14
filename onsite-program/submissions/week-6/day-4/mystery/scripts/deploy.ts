import { ethers } from "hardhat";

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const VRF_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
  const SUBSCRIPTION_ID = BigInt(
    "16178392703129129135061178847449348299961577455616391288129003821713293586225"
  );
  const KEY_HASH =
    "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const ADMIN = deployer.address;

  console.log("\n=== Deploying Token Contracts ===");

  const ERC20Factory = await ethers.getContractFactory("MysteryToken");
  const erc20Token = await ERC20Factory.deploy(ADMIN);
  await erc20Token.waitForDeployment();
  const erc20Address = await erc20Token.getAddress();
  console.log("ERC20 Token deployed to:", erc20Address);

  const ERC721Factory = await ethers.getContractFactory("MysteryNFT");
  const erc721Token = await ERC721Factory.deploy(ADMIN);
  await erc721Token.waitForDeployment();
  const erc721Address = await erc721Token.getAddress();
  console.log("ERC721 Token deployed to:", erc721Address);

  const ERC1155Factory = await ethers.getContractFactory("MysteryMULTI_TOKEN");
  const erc1155Token = await ERC1155Factory.deploy(ADMIN);
  await erc1155Token.waitForDeployment();
  const erc1155Address = await erc1155Token.getAddress();
  console.log("ERC1155 Token deployed to:", erc1155Address);

  console.log("\n=== Deploying Mystery Box Contract ===");

  const MysteryBoxFactory = await ethers.getContractFactory("Mystery_Box");
  const mysteryBox = await MysteryBoxFactory.deploy(
    VRF_COORDINATOR,
    SUBSCRIPTION_ID,
    KEY_HASH,
    ADMIN
  );
  await mysteryBox.waitForDeployment();
  const mysteryBoxAddress = await mysteryBox.getAddress();
  console.log("Mystery Box deployed to:", mysteryBoxAddress);

  console.log("\n=== Setting up Rewards ===");

  const mintAmount = ethers.parseEther("1000");
  await erc20Token.mint(mysteryBoxAddress, mintAmount);
  console.log(
    `Minted ${ethers.formatEther(mintAmount)} ERC20 tokens to Mystery Box`
  );

  await erc721Token.safeMint(mysteryBoxAddress, 1);
  console.log("Minted NFT #1 to Mystery Box");

  await erc1155Token.mint(mysteryBoxAddress, 1, 100, "0x");
  console.log("Minted 100 ERC1155 tokens (ID: 1) to Mystery Box");

  await mysteryBox.addReward(1, erc20Address, ethers.parseEther("10"), 0, 20);
  console.log("Added ERC20 reward: 10 tokens, 20% chance");

  await mysteryBox.addReward(2, erc721Address, 0, 1, 10);
  console.log("Added ERC721 reward: NFT #1, 10% chance");

  await mysteryBox.addReward(3, erc1155Address, 5, 1, 15);
  console.log("Added ERC1155 reward: 5 tokens (ID: 1), 15% chance");

  await mysteryBox.addReward(0, ethers.ZeroAddress, 0, 0, 5);
  console.log("Added extra 'nothing' reward for balance");

  console.log("\n=== Deployment Summary ===");
  console.log("ERC20 Token:", erc20Address);
  console.log("ERC721 Token:", erc721Address);
  console.log("ERC1155 Token:", erc1155Address);
  console.log("Mystery Box:", mysteryBoxAddress);
  console.log("Admin:", ADMIN);
  console.log("Box Price:", "0.01 ETH");

  console.log("\n=== Next Steps ===");
  console.log("1. Fund your VRF subscription");
  console.log(
    "2. Add the Mystery Box contract as a consumer to your VRF subscription"
  );
  console.log("3. Users can now call openBox() with 0.01 ETH to get rewards!");

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n=== Verifying Contracts ===");
    console.log("Waiting 30 seconds before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: erc20Address,
        constructorArguments: [ADMIN],
      });
      console.log("ERC20 Token verified");
    } catch (error) {
      console.log("ERC20 verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: mysteryBoxAddress,
        constructorArguments: [
          VRF_COORDINATOR,
          SUBSCRIPTION_ID,
          KEY_HASH,
          ADMIN,
        ],
      });
      console.log("Mystery Box verified");
    } catch (error) {
      console.log("Mystery Box verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
