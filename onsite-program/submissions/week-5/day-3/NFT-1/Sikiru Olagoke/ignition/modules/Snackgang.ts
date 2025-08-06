// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SnackgangModule = buildModule("SnackgangModule", (m) => {
  const snackgang = m.contract("Snackgang", [
    "0xE2cD6bBad217C1495B023dBa35b40236280Dc356",
  ]);

  return { snackgang };
});

export default SnackgangModule;
