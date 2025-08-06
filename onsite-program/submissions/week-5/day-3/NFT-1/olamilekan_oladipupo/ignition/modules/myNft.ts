// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition


import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyNftModule = buildModule("MyNftModule", (m) => {
  const _address = "0x56C3da91721FeC41B3e1D859729B1B19a00A0F63";

  const owner = m.getParameter("_Owner", _address);


  const MyNft = m.contract("MyNft", [owner]);
  return { MyNft };
});


export default MyNftModule;

