import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TimeModule", (m) => {
  const time = m.contract("TimeNft");

 

  return { time };
});
