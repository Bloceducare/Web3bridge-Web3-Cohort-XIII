import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LootBoxModule", (m) => {
  // Deploy LootToken first
  const lootToken = m.contract("LootToken");

  // VRF Coordinator addresses for different networks
  // Ethereum Mainnet: 0x271682DEB8C4E0901D1a1550aD2e64D568E69909
  // Ethereum Sepolia: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
  // Polygon Mainnet: 0xAE975071Be8F8eE67addBC1A82488F1C24858067
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia testnet
  
  // Key hashes for different networks (gas lanes)
  // Ethereum Sepolia 30 gwei: 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
  // Ethereum Mainnet 200 gwei: 0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Sepolia 30 gwei
  
  // Your VRF subscription ID (you need to create this on vrf.chain.link)
  const subscriptionId = "73178760852785013600739198326329406188048530845410338689608041011091210107479"; // Replace with your actual subscription ID
  
  // Deploy LootBox with constructor parameters
  const lootBox = m.contract("LootBox", [
    vrfCoordinator,
    keyHash, 
    subscriptionId,
    lootToken
  ]);

  // Transfer ownership of LootToken to LootBox so it can mint rewards
  m.call(lootToken, "transferOwnership", [lootBox]);

  return { lootToken, lootBox };
});