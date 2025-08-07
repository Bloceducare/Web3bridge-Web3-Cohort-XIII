import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition


const MultiSigModule = buildModule("MultiSigModule", (m) => {
  const owners = m.getParameter("owners", ["0xf070F568c125b2740391136662Fc600A2A29D2A6", "0x4e94F8Dfc57dF2f1433e3679f6Bcb427aF73f1ce" ]);
  const requiredSignatures = m.getParameter("requiredSignatures", 2);

  const multi = m.contract("Multisig", [owners, requiredSignatures]);

  return { multi };
});

export default MultiSigModule;
