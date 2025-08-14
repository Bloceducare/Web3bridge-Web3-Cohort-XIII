// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { ethers } from "hardhat";

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const TokenModule = buildModule("TokenModule", (m) => {
   const _initialSupply = m.getParameter("initialSupply", ethers.parseUnits("1000", 18));


  const Token = m.contract("PiggyToken", [_initialSupply]);

  return { Token };
});



export default TokenModule;
