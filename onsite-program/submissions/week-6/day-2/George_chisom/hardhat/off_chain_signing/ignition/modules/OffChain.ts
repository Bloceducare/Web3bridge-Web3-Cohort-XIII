import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SwapPermitModule = buildModule("SwapPermitModule", (m) => {
  const swap = m.contract("SwapPermit");

  return { swap };
});

export default SwapPermitModule;
