// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WalletFactoryModule = buildModule("WalletFactoryModule", (m) =>{
  const WalletFactory = m.contract("WalletFactory");
const owners=["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2","0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db"]
   const createWallets=m.call(WalletFactory,"createWallet",[owners]);
   const getWallets=m.call(WalletFactory,"getDeployedWallets",[]);
   

  return {WalletFactory,createWallets,getWallets};
});

export default WalletFactoryModule;