import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const erc20factoryModule = buildModule("erc20factoryModule", (m) => {
  const erc20factory = m.contract("erc20factory");

  return { erc20factory };
});

export default erc20factoryModule;