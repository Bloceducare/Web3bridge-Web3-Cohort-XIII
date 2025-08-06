const hre = require("hardhat");

async function main() {
  const contractAddress = "0x495AE37C0B4D41cb6F9a4f307F8c81a678Bc8f6E"; // Replace with your deployed contract address

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [], // No constructor arguments
  });
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});
