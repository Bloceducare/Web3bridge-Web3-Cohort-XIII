import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  // Deploy GameToken with 1 million initial supply
  const gameToken = m.contract("GameToken", [1000000]);

  // Deploy LudoGame with GameToken address
  const ludoGame = m.contract("LudoGame", [gameToken]);

  return { gameToken, ludoGame };
});

export default LudoGameModule;
