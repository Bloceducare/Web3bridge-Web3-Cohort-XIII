import { run } from "hardhat";

async function main() {
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.error("Please provide contract address as argument");
    console.log("Usage: npx hardhat run scripts/verify.ts --network lisk CONTRACT_ADDRESS");
    process.exit(1);
  }

  console.log("Verifying contract on Lisk Sepolia...");
  console.log("Contract address:", contractAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    
    console.log("Contract verified successfully!");
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
