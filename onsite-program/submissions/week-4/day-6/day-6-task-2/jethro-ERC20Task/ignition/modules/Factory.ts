import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FactoryModule", (m) => {
 

  const factory = m.contract("Factory");

  return { factory };
});