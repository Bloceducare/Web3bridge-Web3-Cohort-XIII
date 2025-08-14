import { ethers } from "hardhat";

async function main() {
  const linkAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const subscriptionId = 1234567890n; // REPLACE WITH YOUR SUB ID
  const fundAmount = ethers.parseUnits("5", 18); // 5 LINK

  const LINK = await ethers.getContractAt("IERC20", linkAddress);
  const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [subscriptionId]);
  const tx = await LINK.transferAndCall(vrfCoordinatorAddress, fundAmount, data);
  await tx.wait();
  console.log("Funded subscription with 5 LINK. Check at https://vrf.chain.link/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});