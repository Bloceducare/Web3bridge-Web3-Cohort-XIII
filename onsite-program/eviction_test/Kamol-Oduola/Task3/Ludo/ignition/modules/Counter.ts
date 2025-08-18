import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LudoGameModule", (m) => {
  const ludo = m.contract("LudoGame");

  m.call(ludo, "incBy", [5n]);

  return { ludo };
});
