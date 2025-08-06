import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const nftModule = buildModule("nftModule", (m) => {
  const mynft = m.contract("HASHIRA");
  return { mynft };
});



export default nftModule;