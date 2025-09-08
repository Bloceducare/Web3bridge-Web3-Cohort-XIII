import { network } from "hardhat";
const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  const RewardERC1155 = await ethers.getContractFactory("RewardERC1155");
  const [deployer] = await ethers.getSigners();

  console.log("Deploying RewardERC1155...");

  const rewardERC1155 = await RewardERC1155.deploy();

  await rewardERC1155.waitForDeployment();

  console.log("RewardERC1155 deployed to:", await rewardERC1155.getAddress());

  const recipient = deployer.address;
  const tokenId = 1; // TOKEN_ID from contract
  const amount = 100; // Amount to transfer
  const data = "0x"; // Empty data for simplicity

  console.log(
    `Transferring ${amount} tokens of ID ${tokenId} to ${recipient}...`
  );
  const tx = await rewardERC1155.transferRewards(
    recipient,
    tokenId,
    amount,
    data
  );
  await tx.wait();
  console.log("Transfer successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
