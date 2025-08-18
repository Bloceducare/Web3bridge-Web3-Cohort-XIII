// ignition/modules/LudoDeploy.ts
import { buildModule } from "@nomicfoundation/ignition-core";
import { ethers } from "hardhat";

export default buildModule("LudoDeploy", (m) => {
  
  const initialSupply = ethers.utils.parseEther("1000");
  const ludoToken = m.contract("LudoToken", [initialSupply]);
  const ludoGame = m.contract("LudoGame", [ludoToken]);

  return { ludoGame, ludoToken };

});

