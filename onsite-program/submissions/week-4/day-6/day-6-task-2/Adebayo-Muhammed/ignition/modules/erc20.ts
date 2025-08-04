import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const erc20tokenModule = buildModule("erc20tokenModule", (m) => {
  const erc20Token = m.contract("erc20token");

  return { erc20Token };
});

export default erc20tokenModule;