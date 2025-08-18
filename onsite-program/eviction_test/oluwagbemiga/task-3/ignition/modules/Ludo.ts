import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  const gameToken = m.contract("GameToken", [1000000]);

  const ludoGame = m.contract("LudoGame", [gameToken]);

  return { gameToken, ludoGame };
});

export default LudoGameModule;