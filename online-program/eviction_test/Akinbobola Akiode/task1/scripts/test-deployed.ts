import { ethers } from "hardhat";

async function main() {
  const DEPLOYED_ADDRESS = "0x32f66D8d0d85f58049dfF25B7029B405F83269A4";
  const ENTRY_FEE = ethers.parseEther("0.01");
  
  console.log("🎯 Testing Deployed Lottery Contract on Sepolia");
  console.log("Contract Address:", DEPLOYED_ADDRESS);
  console.log("Entry Fee:", ethers.formatEther(ENTRY_FEE), "ETH");
  console.log("");

  const lottery = await ethers.getContractAt("Lottery", DEPLOYED_ADDRESS);
  
  const signers = await ethers.getSigners();
  console.log(`Available signers: ${signers.length}`);
  
  console.log("📊 Contract State:");
  console.log("Current Round:", await lottery.currentRound());
  console.log("Players Count:", await lottery.playersCount());
  console.log("Contract Balance:", ethers.formatEther(await ethers.provider.getBalance(DEPLOYED_ADDRESS)), "ETH");
  console.log("Entry Fee:", ethers.formatEther(await lottery.entryFeeWei()), "ETH");
  console.log("Max Players Per Round:", await lottery.MAX_PLAYERS_PER_ROUND());
  console.log("");

  if (signers.length >= 1) {
    const signer = signers[0];
    const signerAddress = await signer.getAddress();
    const balanceBefore = await ethers.provider.getBalance(signerAddress);
    
    console.log("🧪 Testing Single Entry...");
    console.log("Signer Address:", signerAddress);
    console.log("Signer Balance:", ethers.formatEther(balanceBefore), "ETH");
    console.log("");
    
    try {
      console.log("Attempting to enter lottery with 0.01 ETH...");
      const tx = await lottery.connect(signer).enterLottery({ value: ENTRY_FEE });
      console.log("Transaction hash:", tx.hash);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Entry successful! Block:", receipt.blockNumber);
      
      console.log("");
      console.log("📊 Updated Contract State:");
      console.log("Current Round:", await lottery.currentRound());
      console.log("Players Count:", await lottery.playersCount());
      console.log("Contract Balance:", ethers.formatEther(await ethers.provider.getBalance(DEPLOYED_ADDRESS)), "ETH");
      
      const players = await lottery.getPlayers();
      if (players.length > 0) {
        console.log("Current Players:", players);
      }
      
    } catch (error) {
      console.log("❌ Entry failed:", error.message);
    }
  }
  
  console.log("");
  console.log("🎯 Contract Test Complete!");
  console.log("💡 To test full lottery, you need multiple accounts with Sepolia ETH");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
