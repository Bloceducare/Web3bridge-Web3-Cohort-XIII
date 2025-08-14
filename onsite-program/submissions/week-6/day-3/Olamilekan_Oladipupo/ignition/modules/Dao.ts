

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DaoModule = buildModule("DaoModule", (m) => {
    const nftRoles = m.contract("NftRoles");

    const nftAddress = m.contract("Nft");

    const admin = m.getParameter("admin", "0x56C3da91721FeC41B3e1D859729B1B19a00A0F63");

    const dao = m.contract("Dao", [nftRoles, admin, nftAddress]);

    return { dao, nftRoles, nftAddress };
});

export default DaoModule;