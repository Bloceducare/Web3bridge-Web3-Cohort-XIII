// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LudoModule", (m) => {

  const stakeAmount = m.getParameter("stakeAmount", ethers.parseEther("10"));
  const goalPosition = m.getParameter("goalPosition", 10);
  const seed = m.getParameter("seed", 22);

  // Deploy MyToken
  const token = m.contract("MyToken", []);

  const ludoGame = m.contract("LudoGame", [token, stakeAmount, goalPosition, seed]);

  return { token, ludoGame };
});
