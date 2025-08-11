// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
/*import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankFactoryModule = buildModule("PiggyBankFactoryModule", (m) =>{
  const PiggyBankFactory = m.contract("PiggyBankFactory");

   const createPiggyBankTx=m.call(PiggyBankFactory,"createPiggyBank",[]);
   const getUserPiggy=m.call(PiggyBankFactory,"getUserPiggyBanks",[]);
   const getUserAccount=m.call(PiggyBankFactory,"getUserAccountCount",[]);

  return {PiggyBankFactory,createPiggyBankTx,getUserPiggy,getUserAccount};
});

export default PiggyBankFactoryModule;*/


import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankFactoryModule = buildModule("PiggyBankFactoryModule", (m) => {
  
  const piggyBankFactory = m.contract("PiggyBankFactory");

  const lockPeriod = 60 * 60 * 24 * 30;
  const tokenAddress = "0x0000000000000000000000000000000000000000";

  m.call(piggyBankFactory, "createPiggyBank", [lockPeriod, tokenAddress]);
  
 
  const testUser = "0x1234567890123456789012345678901234567890";
  m.call(piggyBankFactory, "getUserPiggyBanks", [testUser]);
  m.call(piggyBankFactory, "getUserAccountCount", [testUser]);

  return { piggyBankFactory };
});

export default PiggyBankFactoryModule;

