import { run } from "hardhat";

async function main() {
  const contractAddress = "0x434722A87Fcbf66a25E808631cC4799b5FF013bD";
  const owners = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  ];
  const requiredConfirmations = 2;

  console.log("Verifying contract...");
  console.log("Contract address:", contractAddress);
  console.log("Owners:", owners);
  console.log("Required confirmations:", requiredConfirmations);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [owners, requiredConfirmations],
      network: "lisk-sepolia"
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 