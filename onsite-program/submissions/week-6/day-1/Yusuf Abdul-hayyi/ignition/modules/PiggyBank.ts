
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


  const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  const owner = "0xe769800585E8f2dFe7AC396dd2d9201A1E95FEa6"; 
  const token = "0x47f01eEFc47EBef78E10894CB0cAFa49df078a9e"; 
  const lockTime = 60 * 60 * 24 * 30; 
  const fee = 300; 

  const piggyBank = m.contract("PiggyBank", [owner, token, lockTime, fee]);
  

  return { piggyBank };
});

export default PiggyBankModule;
