import { buildModule} from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERCModule", (m) => {
  const initialSupply = 1000000; // 1M tokens, NOT in wei
  const erc20 = m.contract("MajorToken", [initialSupply]);

  return { erc20 };
});