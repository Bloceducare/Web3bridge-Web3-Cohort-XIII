import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const EmployeeM = buildModule("Employeem", (m) => {

  const employeem = m.contract("employeem");

  return {employeem};
});

export default EmployeeM;
