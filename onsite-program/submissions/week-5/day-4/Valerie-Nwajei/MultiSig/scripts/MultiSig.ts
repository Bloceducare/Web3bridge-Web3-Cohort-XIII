import { ethers, run } from "hardhat";

async function main() {
  const owners = [
    "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e",
    "0xE8E0Ae7555f1a9a0479b97a86ACca2Dc81bf9922",
    "0x2aCF27e69E2E95f6f40c0b5Ea4cF4a1a3f82AF1C",
  ];
  const required = 2;

  const MultiSig = await ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy(owners, required);

  await multiSig.waitForDeployment();
  const address = await multiSig.getAddress();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("🔍 Verifying...");
  await run("verify:verify", {
    address,
    constructorArguments: [owners, required],
  });

  console.log("🎉 Verified successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
