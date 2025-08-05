import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const GarageAccessModule = buildModule("GarageAccessModule", (m) => {
  
  const garageAccess = m.contract("GarageAccess");

  
  m.call(garageAccess, "addOrUpdateEmployee", [
    "0xA0b5D5441f77EC8F5245feCd27aFfF652345D52F", 
    "Sample Manager", 
    2, 
    true, 
  ]);

  
  m.call(garageAccess, "depositFunds", [], {
    value: ethers.parseEther("1"),
  });

  return { garageAccess };
});

export default GarageAccessModule;