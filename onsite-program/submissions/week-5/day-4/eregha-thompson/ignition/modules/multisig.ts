import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const multisigModule = buildModule("multisigModule", (m) => {
  const multisig = m.contract("multisig");  
    return {multisig}
  });



export default multisigModule;