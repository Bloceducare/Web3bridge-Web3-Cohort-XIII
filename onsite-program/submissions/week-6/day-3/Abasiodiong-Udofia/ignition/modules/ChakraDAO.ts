import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChakraDAOModule = buildModule("ChakraDAOModule", (m) => {
  const chakraMembershipNFT = m.contract("ChakraMembershipNFT");
  const chakraRoleRegistry = m.contract("ChakraRoleRegistry");
  const chakraDAO = m.contract("ChakraDAO", [chakraMembershipNFT, chakraRoleRegistry]);

  return { chakraMembershipNFT, chakraRoleRegistry, chakraDAO };
});

export default ChakraDAOModule;