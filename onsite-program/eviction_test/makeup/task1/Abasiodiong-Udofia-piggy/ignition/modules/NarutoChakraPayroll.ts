// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NarutoChakraPayrollModule = buildModule("NarutoChakraPayrollModule", (m) => {
  const payrollToken = m.getParameter("payrollToken", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // Example USDC (replace with mock or testnet token)

  const payroll = m.contract("NarutoChakraPayroll", [payrollToken]);

  return { payroll };
});

export default NarutoChakraPayrollModule;