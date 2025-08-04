import hre from "hardhat";

async function main() {
  const { ethers } = hre; // ✅ this works even if "ethers" is not exported directly
  const [deployer] = await ethers.getSigners();

  const token = await ethers.getContractAt("ERC20", "0x606F947d350934a3f1D24343600FadFcee7DA9f4");

  const amount = ethers.parseUnits("1000000000000", 12);

  const tx = await token.connect(deployer).mint(amount);
  await tx.wait();

  console.log("✅ Minted 1000 tokens to", await deployer.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
