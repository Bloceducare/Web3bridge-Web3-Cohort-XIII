import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigFactory = buildModule("MultiSigFactory", (m) => {
  const MultiSigFactory = m.contract("MultiSigFactory");
  return { MultiSigFactory };
});

export default MultiSigFactory;