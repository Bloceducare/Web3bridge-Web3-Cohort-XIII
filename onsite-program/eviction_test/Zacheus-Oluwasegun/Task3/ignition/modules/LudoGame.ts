import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_TOKEN_SUPPLY = 1_000_000; 
const STAKE_AMOUNT = "100000000000000000000"; 

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", INITIAL_TOKEN_SUPPLY);
  const mockERC20 = m.contract("MockERC20", [initialSupply]);

  const stakeAmount = m.getParameter("stakeAmount", STAKE_AMOUNT);
  const ludoGame = m.contract("LudoGame", [mockERC20, stakeAmount]);

  return { mockERC20, ludoGame };
});

export default LudoGameModule;
