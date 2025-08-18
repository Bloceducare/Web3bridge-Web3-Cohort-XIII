import { buildModule } from "@nomicfoundation/hardhat-ignition";

export default buildModule("MyNFTModule", (m) => {
  const myNFT = m.contract("MyNFT", [m.getAccount(0)]);

  return { myNFT };
});
