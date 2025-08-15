import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VRFModule", (m) => {
  const vrf = m.contract("SubscriptionConsumer",[29703966656442337173088917262431293237395885812298371556720325877494783664422n]);

  

  return { vrf };
});
