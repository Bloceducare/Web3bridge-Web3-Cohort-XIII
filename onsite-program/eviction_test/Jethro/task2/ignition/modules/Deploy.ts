
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LudoGameModule", (m) => {
  
  const ludoGame = m.contract("LudoGame");


  return { ludoGame };
});