import { run, network } from "hardhat";

/**
 * Contract verification script for DynamicTimeNFT
 * 
 * This script verifies the deployed contract on block explorers like Etherscan.
 * It supports multiple networks and provides detailed verification status.
 * 
 * Usage:
 * - Verify on Sepolia: npx hardhat run scripts/verify.ts --network sepolia
 * - Make sure to set ETHERSCAN_API_KEY in your environment variables
 * 
 * Prerequisites:
 * 1. Contract must be deployed
 * 2. ETHERSCAN_API_KEY must be set in environment or hardhat.config.ts
 * 3. Network must be supported by Etherscan
 */

interface VerificationConfig {
  contractAddress: string;
  constructorArguments: any[];
  contract?: string;
}

async function verifyContract(config: VerificationConfig) {
  console.log("🔍 Starting contract verification...");
  console.log("📡 Network:", network.name);
  console.log("📍 Contract Address:", config.contractAddress);
  
  try {
    // Verify the contract
    await run("verify:verify", {
      address: config.contractAddress,
      constructorArguments: config.constructorArguments,
      contract: config.contract,
    });
    
    console.log("✅ Contract verified successfully!");
    return true;
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("ℹ️  Contract is already verified!");
      return true;
    } else {
      console.error("❌ Verification failed:", error.message);
      return false;
    }
  }
}

async function getExplorerUrl(contractAddress: string): Promise<string> {
  const chainId = network.config.chainId;
  
  switch (chainId) {
    case 1: // Mainnet
      return `https://etherscan.io/address/${contractAddress}`;
    case 11155111: // Sepolia
      return `https://sepolia.etherscan.io/address/${contractAddress}`;
    case 5: // Goerli (deprecated but still used)
      return `https://goerli.etherscan.io/address/${contractAddress}`;
    case 137: // Polygon
      return `https://polygonscan.com/address/${contractAddress}`;
    case 80001: // Mumbai
      return `https://mumbai.polygonscan.com/address/${contractAddress}`;
    case 56: // BSC
      return `https://bscscan.com/address/${contractAddress}`;
    case 97: // BSC Testnet
      return `https://testnet.bscscan.com/address/${contractAddress}`;
    default:
      return `Unknown network (Chain ID: ${chainId})`;
  }
}

async function main() {
  // Contract address - UPDATE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  
  if (!contractAddress) {
    console.error("❌ Please provide the contract address:");
    console.log("   Option 1: Set CONTRACT_ADDRESS environment variable");
    console.log("   Option 2: Update the contractAddress variable in this script");
    console.log("\n   Example:");
    console.log("   CONTRACT_ADDRESS=0x1234... npx hardhat run scripts/verify.ts --network sepolia");
    process.exit(1);
  }

  // Validation: Check if address is valid
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    console.error("❌ Invalid contract address format:", contractAddress);
    process.exit(1);
  }

  console.log("🚀 Starting DynamicTimeNFT verification process...");
  
  // Check if we're on a supported network
  const supportedNetworks = ["sepolia", "mainnet", "polygon", "mumbai", "bsc", "bscTestnet"];
  if (!supportedNetworks.includes(network.name)) {
    console.warn("⚠️  Network", network.name, "may not support verification");
    console.log("   Supported networks:", supportedNetworks.join(", "));
  }

  // DynamicTimeNFT constructor arguments (empty array since it takes no parameters)
  const constructorArguments: any[] = [];

  // Verification configuration
  const verificationConfig: VerificationConfig = {
    contractAddress,
    constructorArguments,
    // Optionally specify the contract path if there are multiple contracts with the same name
    // contract: "contracts/DynamicTimeNFT.sol:DynamicTimeNFT"
  };

  // Perform verification
  const success = await verifyContract(verificationConfig);
  
  if (success) {
    const explorerUrl = await getExplorerUrl(contractAddress);
    
    console.log("\n📋 VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log("✅ Status: Verified");
    console.log("📍 Contract Address:", contractAddress);
    console.log("📡 Network:", network.name);
    console.log("🔗 Explorer URL:", explorerUrl);
    console.log("=".repeat(60));
    
    console.log("\n🎉 Contract is now verified and publicly viewable!");
    console.log("   Users can now:");
    console.log("   • View the source code on the block explorer");
    console.log("   • Interact with the contract through the explorer UI");
    console.log("   • Verify the contract's authenticity");
    
  } else {
    console.log("\n❌ Verification failed. Please check:");
    console.log("   • Contract address is correct");
    console.log("   • Network is supported");
    console.log("   • ETHERSCAN_API_KEY is set correctly");
    console.log("   • Contract was compiled with the same Solidity version");
    console.log("   • Constructor arguments match the deployment");
    
    process.exit(1);
  }
}

// Execute the verification
main()
  .then(() => {
    console.log("🏁 Verification process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Verification process failed:", error);
    process.exit(1);
  });
