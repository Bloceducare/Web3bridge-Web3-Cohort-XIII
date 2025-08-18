
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Ludo = buildModule("Ludo", (m) => {
  const Ludo = m.contract("Ludo");
  return { Ludo };
});

export default Ludo;