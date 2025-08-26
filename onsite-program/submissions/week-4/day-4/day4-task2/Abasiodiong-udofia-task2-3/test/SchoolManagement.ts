import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

// Keep your existing deploySchool fixture above this line

describe("SchoolManagement", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySchool() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const School = await hre.ethers.getContractFactory("SchoolManagement");
    const school = await School.deploy();

    return { school, owner, otherAccount };
  }

  describe("School Creation", function () {
    it("Should create a school successfully", async function () {
      const { school, owner } = await loadFixture(deploySchool);
      const schoolName = "Web3Bridge Academy";

      await expect(school.createSchool(schoolName))
        .to.emit(school, "SchoolCreated")
        .withArgs(owner.address, schoolName);

      const [name, studentCount] = await school.getSchool(owner.address);
      expect(name).to.equal(schoolName);
      expect(studentCount).to.equal(0);
    });

    it("Should fail to create school with empty name", async function () {
      const { school } = await loadFixture(deploySchool);

      await expect(school.createSchool("")).to.be.revertedWith(
        "School name cannot be empty"
      );
    });
  });

  describe("Student Registration", function () {
    it("Should register a student successfully", async function () {
      const { school, owner } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(school.registerStudent("John Doe", 20))
        .to.emit(school, "StudentRegistered")
        .withArgs(owner.address, 0, "John Doe", 20, 0); // 0 = ACTIVE status

      const [name, studentCount] = await school.getSchool(owner.address);
      expect(studentCount).to.equal(1);
    });

    it("Should fail to register student without creating school first", async function () {
      const { school } = await loadFixture(deploySchool);

      await expect(school.registerStudent("John Doe", 20)).to.be.revertedWith(
        "School not created"
      );
    });

    it("Should fail to register student with empty name", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(school.registerStudent("", 20)).to.be.revertedWith(
        "Name cannot be empty"
      );
    });

    it("Should fail to register student with zero age", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(school.registerStudent("John Doe", 0)).to.be.revertedWith(
        "Age must be greater than 0"
      );
    });
  });

  describe("Student Updates", function () {
    it("Should update student successfully", async function () {
      const { school, owner } = await loadFixture(deploySchool);

      await school.createSchool("Test School");
      await school.registerStudent("John Doe", 20);

      await expect(school.updateStudent(0, "Jane Doe", 21, 1)) // 1 = DEFERRED
        .to.emit(school, "StudentUpdated")
        .withArgs(owner.address, 0, "Jane Doe", 21, 1);

      const [id, name, age, status, exists] = await school.getStudent(0);
      expect(name).to.equal("Jane Doe");
      expect(age).to.equal(21);
      expect(status).to.equal(1);
    });

    it("Should fail to update non-existent student", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(
        school.updateStudent(0, "Jane Doe", 21, 1)
      ).to.be.revertedWith("Student does not exist");
    });
  });

  describe("Student Deletion", function () {
    it("Should delete student successfully", async function () {
      const { school, owner } = await loadFixture(deploySchool);

      await school.createSchool("Test School");
      await school.registerStudent("John Doe", 20);

      await expect(school.deleteStudent(0))
        .to.emit(school, "StudentDeleted")
        .withArgs(owner.address, 0);

      const [name, studentCount] = await school.getSchool(owner.address);
      expect(studentCount).to.equal(0);
    });

    it("Should fail to delete non-existent student", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(school.deleteStudent(0)).to.be.revertedWith(
        "Student does not exist"
      );
    });
  });

  describe("Get Student Information", function () {
    it("Should get student information successfully", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");
      await school.registerStudent("John Doe", 20);

      const [id, name, age, status, exists] = await school.getStudent(0);
      expect(id).to.equal(0);
      expect(name).to.equal("John Doe");
      expect(age).to.equal(20);
      expect(status).to.equal(0); // ACTIVE
      expect(exists).to.be.true;
    });

    it("Should fail to get non-existent student", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");

      await expect(school.getStudent(0)).to.be.revertedWith(
        "Student does not exist"
      );
    });
  });

  describe("Get All Student IDs", function () {
    it("Should return all active student IDs", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");
      await school.registerStudent("John Doe", 20);
      await school.registerStudent("Jane Smith", 22);
      await school.registerStudent("Bob Johnson", 19);

      const studentIds = await school.getAllStudentIds();
      expect(studentIds.length).to.equal(3);
      expect(studentIds[0]).to.equal(0);
      expect(studentIds[1]).to.equal(1);
      expect(studentIds[2]).to.equal(2);
    });

    it("Should return correct IDs after deletion", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.createSchool("Test School");
      await school.registerStudent("John Doe", 20);
      await school.registerStudent("Jane Smith", 22);
      await school.registerStudent("Bob Johnson", 19);

      await school.deleteStudent(1);

      const studentIds = await school.getAllStudentIds();
      expect(studentIds.length).to.equal(2);
      expect(studentIds).to.include(0n);
      expect(studentIds).to.include(2n);
      expect(studentIds).to.not.include(1n);
    });
  });

  describe("Multiple Schools", function () {
    it("Should handle multiple schools from different accounts", async function () {
      const { school, owner, otherAccount } = await loadFixture(deploySchool);

      
      await school.createSchool("Owner School");
      await school.registerStudent("Owner Student", 20);

      
      await school.connect(otherAccount).createSchool("Other School");
      await school.connect(otherAccount).registerStudent("Other Student", 22);

      
      const [ownerSchoolName, ownerStudentCount] = await school.getSchool(
        owner.address
      );
      const [otherSchoolName, otherStudentCount] = await school.getSchool(
        otherAccount.address
      );

      expect(ownerSchoolName).to.equal("Owner School");
      expect(ownerStudentCount).to.equal(1);
      expect(otherSchoolName).to.equal("Other School");
      expect(otherStudentCount).to.equal(1);
    });
  });
});
