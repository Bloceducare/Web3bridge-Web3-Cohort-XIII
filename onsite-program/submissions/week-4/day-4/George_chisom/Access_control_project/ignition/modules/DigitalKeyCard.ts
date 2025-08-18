import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DigitalKeyCardModule = buildModule("DigitalKeyCardModule", (m) => {
  const access = m.contract("DigitalKeyCard");

  return { access };
});

export default DigitalKeyCardModule;