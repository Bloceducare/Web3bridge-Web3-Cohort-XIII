// ignition/modules/MyNFTModule.js

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyNFTModule = buildModule("MyNFTModule", (m) => {
  // Get the deployer's address (msg.sender in constructor)
  const deployer = m.getAccount(0);

  // Deploy the MyNFT contract with the deployer's address as the owner
  const myNFT = m.contract("MyNFT", [deployer]);

  return { myNFT };
});

export default MyNFTModule;
