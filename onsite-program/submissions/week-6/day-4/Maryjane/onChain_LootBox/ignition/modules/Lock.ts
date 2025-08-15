import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LootBoxModule", (m) => {
  const lootBox = m.contract("LootBox");

  m.call(lootBox, "incBy", [5n]);

  return { lootBox };
});