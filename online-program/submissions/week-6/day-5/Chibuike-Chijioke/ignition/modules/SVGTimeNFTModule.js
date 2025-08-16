const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SVGTimeNFTModule", (m) => {
  const svgTimeNFT = m.contract("SVGTimeNFT");

  return { svgTimeNFT };
});
