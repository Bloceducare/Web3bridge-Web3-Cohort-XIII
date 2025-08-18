import { buildModule } from "@nomicfoundation/ignition-core";

const PiggybankModule = buildModule("PiggybankModule", (m) => {
  const factory = m.contract("Factory");
  const piggyBank = m.contract("PiggyBank", [factory]);

  return { factory, piggyBank };
});

export default PiggybankModule;