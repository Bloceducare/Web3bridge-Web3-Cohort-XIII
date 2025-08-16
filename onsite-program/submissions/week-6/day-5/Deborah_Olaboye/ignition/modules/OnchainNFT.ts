// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const OnchainModule = buildModule("OnchainModule", (m) => {

  const deployerAddress = m.getAccount(0);
  const onchain = m.contract("OnChainNFT");

  return { onchain };
});

export default OnchainModule;
