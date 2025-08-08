// ignition/modules/Multisig.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigModule = buildModule("MultisigModule", (m) => {
  // Parameters for the Multisig constructor
  // These can be overridden via parameters file or command line
  const defaultOwners = [
    "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", // Default Remix account 1
    "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", // Default Remix account 2
    "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db"  // Default Remix account 3
  ];

  const owners = m.getParameter("owners", defaultOwners);
  const requiredSignatures = m.getParameter("requiredSignatures", 3);

  // Deploy the Multisig contract
  const multisig = m.contract("Multisig", [owners, requiredSignatures], {
    id: "MultisigContract"
  });

  // Optional: Log deployment info
  m.call(multisig, "getTransactionCount", [], {
    id: "InitialTransactionCount"
  });

  return { 
    multisig,
    owners,
    requiredSignatures 
  };
});

export default MultisigModule;