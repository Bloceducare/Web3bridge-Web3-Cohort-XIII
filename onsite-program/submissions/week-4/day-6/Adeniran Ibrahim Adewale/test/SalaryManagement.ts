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

    const address = "0x6Cac76f9e8d6F55b3823D8aEADEad970a5441b67";
    const salary = 20;
    const status = 0;
    const newStatus = 2;
    const index = 0;

    return { payment, address, salary, status, newStatus, index, provider };
  }

  describe("Management Staff salary", function () {
    it("Should register new staff", async function () {
      const { payment, address, salary, status } = await loadFixture(
        deploySalaryManagement
      );

      await payment.registerTeacher(address, salary, status);

      const teacher = await payment.getTeacherInfo(address, 0);
      const teacher_details = teacher;

      expect(teacher_details.teacherAddress).to.equal(address);
      expect(teacher_details.salary).to.equal(salary);
      expect(teacher_details.status).to.equal(status);
    });

    it("Should update staff status", async function () {
      const { payment, address, status, salary, index, newStatus } =
        await loadFixture(deploySalaryManagement);

      await payment.registerTeacher(address, salary, status);
      await payment.updateTeacherStatus(address, index, newStatus);

      const teacher = await payment.getTeacherInfo(address, 0);

      expect(teacher.status).to.equal(newStatus);
    });

    it("Should pay staff salary", async function () {
      const { payment, address, salary, status, index, newStatus, provider } =
        await loadFixture(deploySalaryManagement);

      await payment.registerTeacher(address, salary, status);
      await payment.paySalary(address, index);
      const teacher = await payment.getTeacherInfo(address, 0);
      expect(teacher.salary).to.equal(salary);

      await payment.registerTeacher(address, salary, status);
      const tx = await payment.paySalary(address, index);
      await tx.wait();

      const before = await provider.getBalance(address);
      console.log("balance after", before);

      const after = await provider.getBalance(address);
      console.log("balance after", after);

      expect(after).to.equal(salary);
    });

    //     it("Should pay salary if employed", async function () {
    //   const { payment, address, index, salary, status, provider } = await loadFixture(deploySalaryManagement);
    //   // const salary = hre.ethers.parseEther("1");
    //   // const status = 0; // Employed

    //   // Fund the contract
    //   await hre.network.provider.send("hardhat_setBalance", [
    //     payment.target,
    //     hre.ethers.parseEther("50").toString(), // 10 ETH
    //   ]);

    //   // const provider = hre.ethers.provider;
    //   // const before = await provider.getBalance(address);

    //   await payment.registerTeacher(address, salary, status);
    //   const tx = await payment.paySalary(address, index);
    //   await tx.wait();

    //   const before = await provider.getBalance(address);
    //   console.log("balance after", before);

    //   const after = await provider.getBalance(address);
    //   console.log("balance after", after);

    //   expect(after).to.equal(salary);
    // });
  });
});
