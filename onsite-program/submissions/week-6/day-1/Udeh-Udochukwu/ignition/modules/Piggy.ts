import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyFactory = buildModule("PiggyFactory", (m) => {
  const factory = m.contract("Factory");
  return { factory };
});

export default PiggyFactory;

// Hardhat setup commands (run in terminal)
// npx hardhat init
// npm install --save-dev hardhat
// npx hardhat vars set PRIVATE_KEY
// npx hardhat ignition deploy ignition/modules/ERC20.ts --network liskTestnet --verify
