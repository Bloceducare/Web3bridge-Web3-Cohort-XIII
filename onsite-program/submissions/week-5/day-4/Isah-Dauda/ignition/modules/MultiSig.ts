import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployMultiSigFactoryModule = buildModule("DeployMultiSigFactoryModule", (m) => {
  
  const multiSigFactory = m.contract("SimpleMultiSigFactory");

  const user1 = "0x199674cd60606A67E0Fa9fa28Ef00F58A33d2075";
  const user2 = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
  const user3 = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2";
  const user4 = "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db";
  const user5 = "0x1aE0EA34a72D944a8C7603FfB3eC30a6669E454C";

  
  const approvalsNeeded = 3;

  
  const createMultiSigTx = m.call(multiSigFactory, "createMultiSig", [
    [user1, user2, user3, user4, user5],
    approvalsNeeded,
  ]);


  const allMultiSigs = m.call(multiSigFactory, "getDeployed", []);

  return { multiSigFactory, createMultiSigTx, allMultiSigs };
});

export default DeployMultiSigFactoryModule;
