// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";


const LotteryGameModule = buildModule("LotteryGame", (m) => {
  const entryFee = m.getParameter("entryFee", ethers.parseEther("0.01"));

  const lottery = m.contract("LotteryGame", [entryFee])

  return { lottery};

});

export default LotteryGameModule;
