import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigFactoryModule = buildModule("MultiSigFactoryModule", (m) => {
  const factory = m.contract("MultiSigFactory");

  return { factory };
});

export default MultiSigFactoryModule;

