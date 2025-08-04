import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERCModule = buildModule("ERCModule", (m) => {
  const erc20 = m.contract("ERC20");
  return { erc20 };
});



export default ERCModule;