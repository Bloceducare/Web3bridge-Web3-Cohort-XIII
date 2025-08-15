import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentModule = buildModule("StudentModule", (m) => {
  const student = m.contract("studentManagement");
  return { student };
});



export default StudentModule;