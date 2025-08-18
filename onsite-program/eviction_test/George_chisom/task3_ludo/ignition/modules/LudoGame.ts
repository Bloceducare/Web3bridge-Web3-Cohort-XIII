import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", 1000000);

  const ludoToken = m.contract("LudoToken", [initialSupply]);

  const ludoGame = m.contract("LudoGame", [ludoToken]);

  return { ludoToken, ludoGame };
});

export default LudoGameModule;
