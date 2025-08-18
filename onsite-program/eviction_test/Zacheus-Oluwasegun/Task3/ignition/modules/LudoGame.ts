// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_TOKEN_SUPPLY = 1_000_000; // 1 million tokens
const STAKE_AMOUNT = "100000000000000000000"; // 100 tokens in wei (100 * 10^18)

const LudoGameModule = buildModule("LudoGameModule", (m) => {
  // Deploy MockERC20 token first
  const initialSupply = m.getParameter("initialSupply", INITIAL_TOKEN_SUPPLY);
  const mockERC20 = m.contract("MockERC20", [initialSupply]);

  // Deploy LudoGame contract with token address and stake amount
  const stakeAmount = m.getParameter("stakeAmount", STAKE_AMOUNT);
  const ludoGame = m.contract("LudoGame", [mockERC20, stakeAmount]);

  return { mockERC20, ludoGame };
});

export default LudoGameModule;
