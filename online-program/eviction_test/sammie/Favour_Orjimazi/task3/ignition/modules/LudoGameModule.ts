import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LudoGameModule", (m) => {
  // Define parameters
  const initialSupply = m.getParameter("initialSupply", "1000000000000000000000"); // 1000 tokens in wei (18 decimals)
  const stakeAmount = m.getParameter("stakeAmount", "10000000000000000000"); // 10 tokens in wei (18 decimals)

  // Deploy MyToken
  const token = m.contract("MyToken", [initialSupply]);

  // Deploy LudoGame, passing the token address and stake amount
  const ludo = m.contract("LudoGame", [token, stakeAmount]);

  return { token, ludo };
});