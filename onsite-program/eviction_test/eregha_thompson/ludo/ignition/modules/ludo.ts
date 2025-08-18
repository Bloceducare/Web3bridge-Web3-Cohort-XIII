import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoModule = buildModule("LudoModule", (m) => {
  const ludoToken = m.contract("LudoChallenge");
  return { ludoToken };
});



export default LudoModule;