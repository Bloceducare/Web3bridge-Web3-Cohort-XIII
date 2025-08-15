// // This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DynamicNftModule = buildModule("DynamicNftModule", (m) => {

    const DynamicNft = m.contract("DynamicNft");
    return { DynamicNft };
});

export default DynamicNftModule;