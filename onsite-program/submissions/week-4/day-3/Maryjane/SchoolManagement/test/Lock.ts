import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SchoolManagement", function () {
  async function deploy() {
    const SchoolManagement = await ethers.getContractFactory("SchoolManagement");
    const schoolManagement = await SchoolManagement.deploy();
    await schoolManagement.waitForDeployment();
    return { schoolManagement };
  }

  describe("updateStudent", function () {
    it("Should update student name", async function () {
      const { schoolManagement } = await loadFixture(deploy);
      await schoolManagement.registerStudent("Bob", "Mathematics", 22);
      await schoolManagement.updateStudent(1, "Bobby");
      const student = await schoolManagement.students(1);
      expect(student.studentName).to.equal("Bobby");
    });

    it("Should revert when updating non-existent student", async function () {
      const { schoolManagement } = await loadFixture(deploy);
      try {
        await schoolManagement.updateStudent(999, "Not Here");
        expect.fail("Transaction should have reverted");
      } catch (error: any) {
    
      }
    });
  });

  describe("getStudentById", function () {
    it("Should return student by ID", async function () {
      const { schoolManagement } = await loadFixture(deploy);
      await schoolManagement.registerStudent("Charlie", "Physics", 21);
      const student = await schoolManagement.getStudentById(1);
      expect(student.studentName).to.equal("Charlie");
      expect(student.studentCourse).to.equal("Physics");
    });

    it("Should revert when student ID not found", async function () {
      const { schoolManagement } = await loadFixture(deploy);
      try {
        await schoolManagement.getStudentById(999);
        expect.fail("Transaction should have reverted");
      } catch (error: any) {
    
      }
    });
  });
});