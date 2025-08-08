// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigModule = buildModule("MultiSigModule", (m) => {

  const owners = [
    "0x925c164A113D7fbF28D31f4838A39c30Ee881c9e",
    "0xE8E0Ae7555f1a9a0479b97a86ACca2Dc81bf9922",
    "0x2aCF27e69E2E95f6f40c0b5Ea4cF4a1a3f82AF1C",
    "0x6b2e6f15620B7cb73c3BCfBAD932a1e2e521F25E",
    "0xEcb1E98Cb9c17FabfCfE35e9FF8a7357061e5173",
  ];

  const required= 3;

  const MultiSig = m.contract("MultiSig", [owners, required]);

  return { MultiSig };
});

export default MultiSigModule;
