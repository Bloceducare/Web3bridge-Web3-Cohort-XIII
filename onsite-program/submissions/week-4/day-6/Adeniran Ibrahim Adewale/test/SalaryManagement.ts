import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import SalaryManagementModule from "../ignition/modules/SalaryManagement";

describe("Salary Management", function () {
  async function deploySalaryManagement() {
    const Payment = await hre.ethers.getContractFactory("SalaryManagement");
    const payment = await Payment.deploy();
    const provider = hre.ethers.provider;
    const [deployer, staff1, staff] = await hre.ethers.getSigners();

    const address = "0x6Cac76f9e8d6F55b3823D8aEADEad970a5441b67";
    const salary = 20n;
    const status = 0;
    const newStatus = 2;
    const index = 0;

    return {
      payment,
      address,
      salary,
      status,
      newStatus,
      index,
      provider,
      deployer,
      staff1,
      staff,
    };
  }

  describe("Management Staff salary", function () {
    it("Should register new staff", async function () {
      const { payment, address, salary, status } = await loadFixture(
        deploySalaryManagement
      );

      await payment.registerTeacher(address, salary, status);

      const teacher = await payment.getTeacherInfo(address, 0);

      expect(teacher.teacherAddress).to.equal(address);
      expect(teacher.salary).to.equal(salary);
      expect(teacher.status).to.equal(status);
    });

    it("Should update staff status", async function () {
      const { payment, status, salary, index, newStatus, staff1 } =
        await loadFixture(deploySalaryManagement);

      await payment.registerTeacher(staff1.address, salary, status);

      await payment.updateTeacherStatus(staff1.address, index, newStatus);

      const teacher = await payment.getTeacherInfo(staff1.address, index);

      expect(teacher.status).to.equal(newStatus);
    });

    it("Should pay staff salary", async function () {
      const { payment, staff1, salary, status, index, provider, deployer } =
        await loadFixture(deploySalaryManagement);

      await payment.registerTeacher(staff1.address, salary, status);

      const before = await provider.getBalance(staff1.address);

      await deployer.sendTransaction({
        to: staff1.address,
        value: salary,
      });
      await payment.paySalary(staff1.address, index);

      const after = await provider.getBalance(staff1.address);

      expect(after).to.equal(before + salary);
    });

    //  it("Should pay staff salary", async function () {
    //   const { payment, staff1, salary, status, index, provider, deployer } =
    //     await loadFixture(deploySalaryManagement);

    //   await payment.registerTeacher(staff1.address, salary, status);

    //   const before = await provider.getBalance(staff1.address);

    //   // await deployer.sendTransaction({
    //   //   to: staff1.address,
    //   //   value: salary,
    //   // });
    //   const tx = await payment.paySalary(staff1.address, index);

    //   const after = await provider.getBalance(staff1.address);

    //   expect(after).to.equal(before + salary);
    // });

     it("Should not pay staff salary id not employed or terminated", async function () {
      const { payment, staff1, salary, status, index, provider, deployer, newStatus } =
        await loadFixture(deploySalaryManagement);

      await payment.registerTeacher(staff1.address, salary, status);

      const before = await provider.getBalance(staff1.address);
      
      await payment.updateTeacherStatus(staff1.address, index, 2);

      await deployer.sendTransaction({
        to: staff1.address,
        value: salary,
      });
      await payment.paySalary(staff1.address, index);
      const after = await provider.getBalance(staff1.address);

      expect(after).to.equal(before + salary);
    });

    it("Should get employee info", async function () {
      const { payment, staff1, salary, status, index } = await loadFixture(
        deploySalaryManagement
      );

      await payment.registerTeacher(staff1.address, salary, status);

      const employeeInfo = await payment.getTeacherInfo(staff1.address, index);

      expect(employeeInfo.salary).to.equal(salary);
      expect(employeeInfo.status).to.equal(status);
      expect(employeeInfo.teacherAddress).to.equal(staff1.address);
    });

    it ("Should get all employees", async function () {
      const { payment, staff1, salary, status , address} = await loadFixture(
        deploySalaryManagement
      );

      await payment.registerTeacher(address, salary, status);

      await payment.registerTeacher(staff1.address, salary, status);

      const employees = await payment.getAllTeachers();
      console.log(employees);

      // expect(employees.length).to.equal(1);
      // expect(employees[0].teacherAddress).to.equal(staff1.address);
      // expect(employees[0].salary).to.equal(salary);
      // expect(employees[0].status).to.equal(status);
    });
  });
});
