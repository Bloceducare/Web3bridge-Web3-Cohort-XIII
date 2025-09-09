
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const PiggyBankModule = buildModule("PiggyBankModule", (m) => {
  const owner = "0xe769800585E8f2dFe7AC396dd2d9201A1E95FEa6";
  const factoryAdmin = "0x47f01eEFc47EBef78E10894CB0cAFa49df078a9e";        // some valid address
  const name = "PiggyBank";            
  const token = "0x47f01eEFc47EBef78E10894CB0cAFa49df078a9e";

  const piggyBank = m.contract("PiggyBank", [owner, factoryAdmin, name, token]);


  return { piggyBank };
});

export default PiggyBankModule;
