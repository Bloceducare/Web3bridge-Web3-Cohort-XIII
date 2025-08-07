import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem", function () {
  async function deploySchoolFixture() {
    const School = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const school = await School.deploy();
    return { school };
  }

  describe("Student Registration", function () {
    it("Should register a student", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student] = await hre.ethers.getSigners();

      await school.register_student(student.address, "Alice", "Math", 20);
      const studentData = await school.get_student(student.address);

      expect(studentData.name).to.equal("Alice");
      expect(studentData.course).to.equal("Math");
      expect(studentData.age).to.equal(20);
      expect(studentData.status).to.equal(0); // ACTIVE
    });

    it("Should not register the same student twice", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student] = await hre.ethers.getSigners();

      await school.register_student(student.address, "Alice", "Math", 20);
      await expect(
        school.register_student(student.address, "Alice", "Math", 20)
      ).to.be.revertedWithCustomError(school, "STUDENT_ALREADY_REGISTERED");
    });
  });

  describe("Student Updates", function () {
    it("Should update student name", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student] = await hre.ethers.getSigners();

      await school.register_student(student.address, "Alice", "Math", 20);
      await school.update_student(student.address, "Alicia");

      const updated = await school.get_student(student.address);
      expect(updated.name).to.equal("Alicia");
    });

    it("Should update student status", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student] = await hre.ethers.getSigners();

      await school.register_student(student.address, "Alice", "Math", 20);
      await school.update_student_status(student.address, 1); // DEFERRED

      const updated = await school.get_student(student.address);
      expect(updated.status).to.equal(1);
    });
  });

  describe("Student Deletion", function () {
    it("Should delete a student", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student] = await hre.ethers.getSigners();

      await school.register_student(student.address, "Alice", "Math", 20);
      await school.delete_student(student.address);

      await expect(
        school.get_student(student.address)
      ).to.be.revertedWithCustomError(school, "STUDENT_NOT_FOUND");
    });
  });

  describe("All Students", function () {
    it("Should return all registered students", async function () {
      const { school } = await loadFixture(deploySchoolFixture);
      const [_, student1, student2] = await hre.ethers.getSigners();

      await school.register_student(student1.address, "Alice", "Math", 20);
      await school.register_student(student2.address, "Bob", "Science", 22);

      const all = await school.get_all_students();
      expect(all.length).to.equal(2);
      expect(all[0].name).to.equal("Alice");
      expect(all[1].name).to.equal("Bob");
    });
  });
});
