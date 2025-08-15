import { run, ethers } from "hardhat";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Verifying on ${network.name} (${network.chainId})`);
  

  const deployment = require(`../deployments/${network.name}.json`);
  
  console.log(`Verifying TimeNFT at ${deployment.address}`);
  
  await run("verify:verify", {
    address: deployment.address,
    constructorArguments: [],
    contract: "contracts/OnchainNFT.sol:TimeNFT"
  });

  console.log("Contract verified successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});