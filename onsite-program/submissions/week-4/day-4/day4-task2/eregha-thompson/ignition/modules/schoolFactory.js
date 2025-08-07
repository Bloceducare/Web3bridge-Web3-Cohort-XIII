import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const factoryModule = buildModule("factoryModule", (m) => {
  const SchoolFactory = m.contract("schoolFactory");
  return { SchoolFactory };
});



export default factoryModule;