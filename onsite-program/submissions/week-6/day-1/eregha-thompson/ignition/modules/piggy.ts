import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyModule = buildModule("piggyModule", (m) => {
  const storage = m.contract("piggyFactory");  
    return {storage}
  });



export default PiggyModule;