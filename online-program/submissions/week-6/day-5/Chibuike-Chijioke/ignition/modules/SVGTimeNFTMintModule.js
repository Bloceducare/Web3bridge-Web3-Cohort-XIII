const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SVGTimeNFTMintModule", (m) => {
  const existingContract = m.contractAt(
    "SVGTimeNFT",
    "0x094af43Cb79614ce31BFD702F657d918c1d5aAC7"
  );

  m.call(existingContract, "mintTo", [
    "0x6371c59fc596c83d4f0C1C4607D53093a35950Ec",
  ]);

  return {};
});
