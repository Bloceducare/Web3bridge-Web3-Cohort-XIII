import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyModule = buildModule("piggyModule", (m) => {
  const storage = m.contract("Savings_Account");  
    return {storage}
  });



export default PiggyModule;