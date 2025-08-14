// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TGDModule = buildModule("TGDModule", (m) => {

const tgd = m.contract("ManageDAO", ["0xE65B037ec83eA37E86Cd72675407BaA3594941Bb"]);

  return { tgd };
});

export default TGDModule;
