import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiSignatureAccountModule", (m) => {
  const owners = [
    "0x1234567890123456789012345678901234567890",
    "0x0987654321098765432109876543210987654321",
    "0xabcdef1234567890abcdef1234567890abcdef12",
  ];
  const required = m.getParameter("required", 2);

  const multiSig = m.contract("MultiSignatureAccount", [owners, required]);

  return { multiSig };
});