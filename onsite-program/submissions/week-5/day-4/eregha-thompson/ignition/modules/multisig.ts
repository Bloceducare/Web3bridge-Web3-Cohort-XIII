import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const multisigModule = buildModule("multisigModule", (m) => {
  const multisig = m.contract("Multisig");  
    return {multisig}
  });



export default multisigModule;