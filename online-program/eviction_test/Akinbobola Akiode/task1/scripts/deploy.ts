import { ethers, run } from "hardhat";

async function main() {
  const entryFee = ethers.parseEther("0.01");
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(entryFee);
  await lottery.waitForDeployment();

  const address = await lottery.getAddress();
  console.log(`Lottery deployed: ${address}`);

  if (process.env.RPC_URL && process.env.ETHERSCAN_API_KEY && process.env.PRIVATE_KEY) {
    await new Promise((r) => setTimeout(r, 30000));
    try {
      await run("verify:verify", { address, constructorArguments: [entryFee] });
      console.log("Verified");
    } catch (e) {
      console.log(`Verify skipped: ${String(e)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


