// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const MyNFTModule = buildModule("MyNFTModule", (m) => {

  const address = "0x43bcA2D4f5398117c3516499609c6e11909d90E9";


  const myNFT = m.contract("MyNFT", [address]);
 
  return { myNFT };
});

export default MyNFTModule;
