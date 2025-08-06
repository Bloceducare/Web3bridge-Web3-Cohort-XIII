// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const FactoryErc20Module = buildModule("FactoryErc20Module", (m) => {

  // const initialAmount = m.getParameter("initialAmount", "1000000");
  // const name = m.getParameter("name", "MyToken");
  // const symbol = m.getParameter("symbol", "MTK");
  // const decimals = m.getParameter("decimals", 18);
  // const owner = m.getParameter("owner", m.getAccount(0));
  const factoryErc20Module = m.contract("FactoryErc20");

return {factoryErc20Module};
});

export default FactoryErc20Module;
