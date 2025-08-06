import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const factoryModule = buildModule("factoryModule", (m) => {
  const factory = m.contract("ERC20factory");
  return { factory };
});



export default factoryModule;