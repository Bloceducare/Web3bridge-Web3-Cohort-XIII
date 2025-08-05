// scripts/verify.js

const hre = require("hardhat");

async function main() {
  // Replace these with the actual deployed addresses
  const tokenAAddress = "0xe15B3B38302aadd79E5Bdc7DCeddf04C61BD283F";
  const tokenBAddress = "0x5A6f7298cF4e42bf0ECb8e7fDb70633EE222Fc16";
  const stakingAddress = "0xBd63F4f18455b0d41A53b8eD29458e34612Ee361";

  const lockPeriod = 7 * 24 * 60 * 60; // Must match what you used in deployment

  console.log("Verifying TokenA...");
  await hre.run("verify:verify", {
    address: tokenAAddress,
    constructorArguments: [],
  });

  console.log("Verifying TokenB...");
  await hre.run("verify:verify", {
    address: tokenBAddress,
    constructorArguments: [],
  });

  console.log("Verifying Staking...");
  await hre.run("verify:verify", {
    address: stakingAddress,
    constructorArguments: [
      tokenAAddress,
      tokenBAddress,
      lockPeriod
    ],
  });

  console.log("All contracts verified ✅");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
