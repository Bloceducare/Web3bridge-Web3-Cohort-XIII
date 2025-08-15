import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChakraTimeNFTModule = buildModule("ChakraTimeNFTModule", (m) => {
  const chakraTimeNFT = m.contract("ChakraTimeNFT");

  return { chakraTimeNFT };
});

export default ChakraTimeNFTModule;