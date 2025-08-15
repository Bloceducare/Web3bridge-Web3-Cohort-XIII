import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RAFIKNFTModule", (m) => {
  const counter = m.contract("RAFIKNFT");
  return { counter };
});
