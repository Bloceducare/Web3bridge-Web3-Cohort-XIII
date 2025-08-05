const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");

describe("SchoolManagement Contract", function () {
  async function deploySchoolManagement() {
    const [owner] = await hre.ethers.getSigners();

    const SchoolManagement = await hre.ethers.getContractFactory("SchoolManagement");
    const schoolManagement = await SchoolManagement.deploy();

    return { schoolManagement, owner };
  }

  describe("Deployment", function () {
    it("Should deploy the contract correctly", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      expect(schoolManagement.address).to.not.equal(hre.ethers.ZeroAddress);
    });
  });

  describe("Main Functions", function () {
    it("Should register a new student", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      const name = "John Doe";
      const age = 20;

      await schoolManagement.registerStudent(name, age);
      const student = await schoolManagement.getStudent(1);

      expect(student[0]).to.equal(1n); // id
      expect(student[1]).to.equal(name); // name
      expect(student[2]).to.equal(age); // age
      expect(student[3]).to.equal(0); // Status.ACTIVE
    });

    it("Should update student details", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      await schoolManagement.registerStudent("John Doe", 20);

      const newName = "Jane Doe";
      const newAge = 21;
      await schoolManagement.updateStudent(1, newName, newAge);

      const student = await schoolManagement.getStudent(1);
      expect(student[1]).to.equal(newName);
      expect(student[2]).to.equal(newAge);
    });

    it("Should update student status", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      await schoolManagement.registerStudent("John Doe", 20);

      await schoolManagement.updateStudentStatus(1, 1); // Status.DEFERRED
      const student = await schoolManagement.getStudent(1);
      expect(student[3]).to.equal(1); // Status.DEFERRED
    });

    it("Should delete a student", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      await schoolManagement.registerStudent("John Doe", 20);

      await schoolManagement.deleteStudent(1);
      const student = await schoolManagement.getStudent(1);
      expect(student[0]).to.equal(0n); // id reset
      expect(student[1]).to.equal(""); // name reset
      expect(student[2]).to.equal(0n); // age reset
    });

    it("Should get all students", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      await schoolManagement.registerStudent("John Doe", 20);
      await schoolManagement.registerStudent("Jane Doe", 21);

      const students = await schoolManagement.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0][1]).to.equal("John Doe");
      expect(students[1][1]).to.equal("Jane Doe");
    });

    it("Should fail with invalid student ID", async function () {
      const { schoolManagement } = await loadFixture(deploySchoolManagement);
      await expect(
        schoolManagement.getStudent(1)
      ).to.be.revertedWith("Invalid student ID");
    });
  });
});