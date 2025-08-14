// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { ethers } from "hardhat";

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const PiggyBankFactoryModule= buildModule("PiggyBankModule", (m) => {
  const _tokenAddress = "0x2F75EC3E3e6c64166Bc99e2EC83Ae5Ab38DEac0D"

  const PiggyBankFactory = m.contract("PiggyToken", [_tokenAddress]);

  return { PiggyBankFactory };
});



export default PiggyBankFactoryModule
