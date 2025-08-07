import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("StudentManagement", function () {
  async function deployStudentManagement() {
    const StudentManagement = await hre.ethers.getContractFactory("StudentManagement");
    const studentManagement = await StudentManagement.deploy();
    const [owner, studentA, studentB] = await hre.ethers.getSigners();

    return { studentManagement, owner, studentA, studentB };
  }

  describe("Student Registration", function () {
    it("should register a student and assert their details", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const _name = "Olamilekan";
      const _age = 20;
      const _gender = 0;

      await studentManagement.registerStudent(_name, _age, _gender);
      const student = await studentManagement.getStudent(0);

      expect(student.name).to.equal(_name);
      expect(student.age).to.equal(_age);
      expect(student.gender).to.equal(_gender);
      expect(student.status).to.equal(0);
    });

    it("should set and get student name", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.setName("Josh", 0);
      const updatedName = await studentManagement.getStudentName(0);

      expect(updatedName).to.equal("Josh");
    });

    it("should set and get student age", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.setAge(25, 0);
      const updatedAge = await studentManagement.getStudentAge(0);

      expect(updatedAge).to.equal(25);
    });

    it("should set and get student score", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.setScore(95, 0);
      const updatedScore = await studentManagement.getStudentScore(0);

      expect(updatedScore).to.equal(95);
    });

    it("should set and get student gender", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.setGender(1, 0);
      const updatedGender = await studentManagement.getStudentGender(0);

      expect(updatedGender).to.equal(1);
    });

    it("should set and get student status", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.setStatus(2, 0);
      const updatedStatus = await studentManagement.getStudentStatus(0);

      expect(updatedStatus).to.equal(2);
    });

    it("should delete a student", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await studentManagement.registerStudent("Olamilekan", 20, 0);
      await studentManagement.deleteStudent(0);
      const deletedStudent = await studentManagement.getStudent(0);

      expect(deletedStudent.name).to.equal("");
      expect(deletedStudent.age).to.equal(0);
      expect(deletedStudent.score).to.equal(0);
    });

    it("should revert if index is invalid when getting student", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      await expect(studentManagement.getStudent(0)).to.be.revertedWith("invalid index");
    });
  });
});
