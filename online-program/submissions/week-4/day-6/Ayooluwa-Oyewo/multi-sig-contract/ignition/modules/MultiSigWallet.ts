// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigWalletModule = buildModule("MultiSigWalletModule", (m) => {
    const requiredConfirmations = m.getParameter("requiredConfirmations", 1);
    const owners = m.getParameter("owners", [
        "0x5A232799eb8BBB999B1f056A0Ba0d8C7d5c1ebe0",
    ]);

    const multiSigWallet = m.contract("MultiSigWallet", [requiredConfirmations, owners]);

    return { multiSigWallet };
});

export default MultiSigWalletModule;
