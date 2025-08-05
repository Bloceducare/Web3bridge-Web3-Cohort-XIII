import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem Deployment", function () {
  async function deploySchool() {
    const School = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const school = await School.deploy();
    return { school };
  }

  describe("Student Registration", function () {
    it("Should register a new student", async function () {
      const { school } = await loadFixture(deploySchool);

      const name = "Sherif";
      const age = 16;

      await school.registerStudent(name, age);

      const student = await school.getStudent(0);
      expect(student.name).to.equal(name);
      expect(student.age).to.equal(age);
      expect(student.status).to.equal(0); // ACTIVE = 0
    });
  });

  describe("Update Student Info", function () {
    it("Should update student's name and age", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.registerStudent("Sherif", 16);

      await school.updateStudent(0, "UpdatedName", 18);

      const student = await school.getStudent(0);
      expect(student.name).to.equal("UpdatedName");
      expect(student.age).to.equal(18);
    });
  });

  describe("Update Student Status", function () {
    it("Should change status to RUSTICATED", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.registerStudent("Sherif", 16);

      await school.updateStatus(0, 2); // RUSTICATED = 2

      const student = await school.getStudent(0);
      expect(student.status).to.equal(2);
    });
  });

  describe("Delete Student", function () {
    it("Should delete the student", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.registerStudent("Sherif", 16);

      await school.deleteStudent(0);

      const student = await school.getStudent(0);
      expect(student.name).to.equal("");
      expect(student.age).to.equal(0);
      expect(student.status).to.equal(0);
    });
  });

  describe("Student Count", function () {
    it("Should return all students", async function () {
      const { school } = await loadFixture(deploySchool);

      await school.registerStudent("Ayo", 15);
      await school.registerStudent("Bisi", 17);

      const all = await school.getAllStudents();
      expect(all.length).to.equal(2);
    });
  });
});
