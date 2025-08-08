import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FactoryMultiSig = buildModule("FactoryMultiSig", (m) => {
  const factoryMultiSig = m.contract("FactoryMultiSig");  
    return {factoryMultiSig}
  });



export default FactoryMultiSig;