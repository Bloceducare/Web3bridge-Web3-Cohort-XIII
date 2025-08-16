// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const OnChaiNftModule = buildModule("OnChaiNftModule", (m) => {

  const onChaiNft = m.contract("OnChaiNft");

  return { onChaiNft };
});

export default OnChaiNftModule;