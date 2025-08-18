import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const svgNft = m.contract("SvgNft");

  return { svgNft };
});
