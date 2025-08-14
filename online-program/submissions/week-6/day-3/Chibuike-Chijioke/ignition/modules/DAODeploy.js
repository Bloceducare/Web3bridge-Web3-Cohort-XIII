const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DAODeployModule", (m) => {
  const roleNFT = m.contract("RoleNFT");

  const councilDAO = m.contract("CouncilDAO", [roleNFT]);

  return { roleNFT, councilDAO };
});
