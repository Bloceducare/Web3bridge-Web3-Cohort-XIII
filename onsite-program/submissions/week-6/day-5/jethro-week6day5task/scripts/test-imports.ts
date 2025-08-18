import hre from "hardhat";

async function main() {
  console.log("Available properties in hre:", Object.keys(hre));
  
  // Try to access ethers
  try {
    console.log("Trying hre.ethers...");
    console.log("hre.ethers:", hre.ethers);
  } catch (error) {
    console.log("hre.ethers not available:", error);
  }

  // Try to access network
  try {
    console.log("Trying hre.network...");
    console.log("hre.network:", hre.network);
  } catch (error) {
    console.log("hre.network not available:", error);
  }
}

main().catch(console.error);
