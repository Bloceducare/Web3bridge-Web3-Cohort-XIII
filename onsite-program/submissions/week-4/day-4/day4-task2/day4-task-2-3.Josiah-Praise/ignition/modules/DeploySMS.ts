import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SMSModule = buildModule("SMSModule", (m) => {
  const sms = m.contract("SchoolManagementSystem");

  return { sms };
});

export default SMSModule;
