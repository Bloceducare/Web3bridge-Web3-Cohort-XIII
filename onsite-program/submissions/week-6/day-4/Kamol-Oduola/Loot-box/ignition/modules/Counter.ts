// ignition/modules/LootBoxModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  const vrfCoordinator = m.getParameter("vrfCoordinator");
  const linkToken = m.getParameter("linkToken");
  const keyHash = m.getParameter("keyHash");
  const subscriptionId = m.getParameter("subscriptionId");
  const boxFee = m.getParameter("boxFee");

  const lootToken = m.contract("LootToken");
  const lootNFT = m.contract("LootNFT");
  const lootItems = m.contract("LootItems");

  const lootBox = m.contract("LootBox", [
    vrfCoordinator,
    linkToken,
    keyHash,
    subscriptionId,
    boxFee,
    lootToken,
    lootNFT,
    lootItems,
  ]);

  return { lootToken, lootNFT, lootItems, lootBox };
});

export default LootBoxModule;
