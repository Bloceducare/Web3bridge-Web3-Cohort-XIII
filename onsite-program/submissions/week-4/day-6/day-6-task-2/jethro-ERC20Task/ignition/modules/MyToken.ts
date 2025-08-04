import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenModule", (m) => {
  const name = "MyToken"; 
  const symbol = "MTK"; 
  const initialSupply = m.getParameter("initialSupply", "1000000000000000000000"); 

  const myToken = m.contract("MyToken", [name, symbol, initialSupply]);

  return { myToken };
});