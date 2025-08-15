
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LootBoxModule = buildModule("LootBoxModule", (m) => {
  const lootbox = m.contract("LootBox");
  return { lootbox};
});

export default LootBoxModule;
