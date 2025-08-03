// SPDX-License-Identifier: MIT
// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more: https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_SUPPLY = 1_000_000n * 10n ** 12n; // 1 million tokens with 12 decimals

const ERC20Module = buildModule("ERC20Module", (m) => {
  const initialSupply = m.getParameter("initialSupply", INITIAL_SUPPLY);

  const token = m.contract("ERC20", [initialSupply]);

  return { token };
});

export default ERC20Module;
