import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoTokenModule = buildModule("LudoTokenModule", (m) => {
  const ludoToken = m.contract("LudoToken");
  return { ludoToken };
});



export default LudoTokenModule;