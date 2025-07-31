import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Web3BridgeGarageAccessModule", (m) => {
  // Deploy the Web3BridgeGarageAccess contract
  const garageAccess = m.contract("Web3BridgeGarageAccess");

  // Optional: Add an employee after deployment (example)
  m.call(garageAccess, "addOrUpdateEmployee", [
    "0x1234567890123456789012345678901234567890", // Example address
    "John Doe", // Example name
    2, // Role.MENTOR (enum value)
    true, // isActive
  ]);

  return { garageAccess };
});