// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const MultiSig = buildModule("MultiSig", (m) => {
  const owners = [
    "0x58A8D815eE6D1DDd027341650139B21c3258172b", 
    "0xb17FCC510aC760Fe181Ff4F8eac270Ae5380b44B",
    "0x02AF376f613938A58c9567128E82bf3536a76F27"
  ];
  const confirmations = 3;
 
  const multiSig = m.contract("MultiSig",[owners,confirmations])

  return { multiSig };
});

export default MultiSig;
