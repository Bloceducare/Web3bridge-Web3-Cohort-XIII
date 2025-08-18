import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LudoModule = buildModule("LudoModule", (m) => {
 
  const token = m.contract("Ludo20Token");
  console.log("First Contract for the Token: ", token)

  const ludo = m.contract("web3BridgeLudo", [token]);
  console.log("Second Contract for the Game: ", ludo)


  return { token, ludo };
});

export default LudoModule;
