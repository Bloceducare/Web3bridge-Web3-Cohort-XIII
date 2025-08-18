// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MultiSigModule = buildModule("MultiSigModule", (m) => {
   const owners = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  ];

  const requiredSignatures = 3;

  const multiSig = m.contract("MultiSig", [owners, requiredSignatures])
  return { multiSig };
});
  

export default MultiSigModule;
