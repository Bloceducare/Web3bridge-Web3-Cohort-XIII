// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Piggy = buildModule("Piggy", (m) => {
  const Piggy = m.contract("Piggy");
  return { Piggy };
});

export default Piggy;


// Hardhat setup commands (run in terminal)
// npx hardhat init
// npm install --save-dev hardhat
// npx hardhat vars set PRIVATE_KEY
// npx hardhat ignition deploy ignition/modules/ERC20.ts --network liskTestnet --verify
