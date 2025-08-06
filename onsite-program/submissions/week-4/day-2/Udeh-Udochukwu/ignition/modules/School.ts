import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const School = buildModule("School", (m) => {
  const School = m.contract("School");
  return { School };
});

export default School;