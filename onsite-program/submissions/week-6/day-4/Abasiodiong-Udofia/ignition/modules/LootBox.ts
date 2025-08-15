import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  const vrfCoordinator = m.getParameter("vrfCoordinator", "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625");
  const subscriptionId = m.getParameter("subscriptionId", 0);
  const keyHash = m.getParameter("keyHash", "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c");
  const fee = m.getParameter("fee", BigInt(100000000000000000));

  // const lootBox = m.contract("LootBox", [vrfCoordinator, subscriptionId, keyHash, fee]);
  const lootBox = m.contract("LootBox");

  return { lootBox };
});

export default LootBoxModule;