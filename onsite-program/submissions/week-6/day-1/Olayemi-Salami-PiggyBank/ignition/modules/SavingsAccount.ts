import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SavingsAccountModule = buildModule("SavingsAccountModule", (m) => {
  const token = m.getParameter("token", "0x0fEc8E39CA6F2F4D37C98aB76363C2f415958fc2");
  const lockPeriod = m.getParameter("lockPeriod", 60 * 60 * 24 * 30);
  const owner = m.getParameter("owner", "0x0fEc8E39CA6F2F4D37C98aB76363C2f415958fc2");
  const goal = m.getParameter("goal", 1000); 

  const savingsaccount = m.contract("SavingsAccount", [
    token,
    lockPeriod,
    owner,
    goal,
  ]);

  return { savingsaccount };
});

export default SavingsAccountModule;
