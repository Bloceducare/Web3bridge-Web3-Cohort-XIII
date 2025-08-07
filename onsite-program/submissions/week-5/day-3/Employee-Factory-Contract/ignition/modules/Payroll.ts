// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PayrollFactoryModule = buildModule("PayrollFactoryModule", (m) =>{
  const PayrollFactory = m.contract("PayrollFactory");

   const createPayrollTx=m.call(PayrollFactory,"createPayroll",[]);
   const getPayrolls=m.call(PayrollFactory,"getAllPayrolls",[]);
   const getMyPayroll=m.call(PayrollFactory,"getMyPayrolls",[]);

  return {PayrollFactory,createPayrollTx,getPayrolls,getMyPayroll};
});

export default PayrollFactoryModule;