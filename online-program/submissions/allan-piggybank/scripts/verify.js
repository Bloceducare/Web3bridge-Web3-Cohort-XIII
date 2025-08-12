const hre = require("hardhat");

async function main() {
  const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // replace after deploy

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [
      "OWNER_ADDRESS_HERE",     // same as used during deployment
      "TOKEN_ADDRESS_HERE",     // Zero address for ETH
      60 * 60 * 24,              // lock period
      "FACTORY_ADMIN_ADDRESS_HERE"
    ],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
