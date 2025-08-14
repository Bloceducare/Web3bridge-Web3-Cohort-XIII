// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const TokenGatedDaoModule = buildModule("TokenGatedDaoModule", (m) => {
   const myNft = m.contract("MyNft");
   const erc7432 = m.contract("ERC7432");

  const tokenGatedDaoModule = m.contract("TokenGatedDao",[myNft,erc7432])
      
   return { tokenGatedDaoModule };
});

export default TokenGatedDaoModule;
