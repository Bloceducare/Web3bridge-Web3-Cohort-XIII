import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SchoolManagement", () => {
  async function deploySchoolManageSystem() {
    const SchoolManage = await ethers.getContractFactory("SchoolManagement");
    const [deployer, addr1] = await ethers.getSigners();
    const schoolManage = await SchoolManage.deploy(deployer.address);
    await schoolManage.waitForDeployment();
    return { schoolManage, deployer, addr1 };
  }

  describe("Student creation, retrieval, update, status, and deletion", () => {
    it("Should create a student and retrieve all students", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      const students = await schoolManage.getStudents();

      expect(students.length).to.equal(1);
      expect(students[0].name).to.equal("Bilal");
      expect(students[0].age).to.equal(12);
    });

    it("Should get a specific student", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      const student = await schoolManage.getStudent(0);

      expect(student.name).to.equal("Bilal");
      expect(student.age).to.equal(12);
    });

    it("Should revert when getting a student with invalid index", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);
      await expect(schoolManage.getStudent(0)).to.be.revertedWith(
        "Index is invalid or does not exist"
      );
    });

    it("Should update a student details (onlyOwner)", async () => {
      const { schoolManage, deployer } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      await schoolManage.updateStudent(0, "Shola", 16, "Ibadan");

      const updatedStudent = await schoolManage.getStudent(0);
      expect(updatedStudent.name).to.equal("Shola");
      expect(updatedStudent.age).to.equal(16);
      expect(updatedStudent.homeAddress).to.equal("Ibadan");
    });

    it("Should revert update when called by non-owner", async () => {
      const { schoolManage, addr1 } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      await expect(
        schoolManage.connect(addr1).updateStudent(0, "Shola", 16, "Ibadan")
      ).to.be.revertedWith("Only the owner can call this function");
    });

    it("Should change status to DEFERRED, RUSTICATED, ACTIVE", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");

      // Defer
      await schoolManage.deferStudent(0);
      expect(await schoolManage.getStudentStatus(0)).to.equal("DEFERRED");

      // Rusticate
      await schoolManage.rusticateStudent(0);
      expect(await schoolManage.getStudentStatus(0)).to.equal("RUSTICATED");

      // Activate again
      await schoolManage.activateStudent(0);
      expect(await schoolManage.getStudentStatus(0)).to.equal("ACTIVE");
    });

    it("Should revert status change for invalid index", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);

      await expect(schoolManage.deferStudent(0)).to.be.revertedWith(
        "Index is invalid or does not exist"
      );
      await expect(schoolManage.rusticateStudent(0)).to.be.revertedWith(
        "Index is invalid or does not exist"
      );
      await expect(schoolManage.activateStudent(0)).to.be.revertedWith(
        "Index is invalid or does not exist"
      );
    });

    it("Should delete a student (onlyOwner)", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      await schoolManage.deleteStudent(0);

      const students = await schoolManage.getStudents();
      expect(students[0].name).to.equal("");
    });

    it("Should revert delete when called by non-owner", async () => {
      const { schoolManage, addr1 } = await loadFixture(deploySchoolManageSystem);

      await schoolManage.createStudent("Bilal", 12, "bilal@gmail.com", "Lagos");
      await expect(
        schoolManage.connect(addr1).deleteStudent(0)
      ).to.be.revertedWith("Only the owner can call this function");
    });

    it("Should revert delete for invalid index", async () => {
      const { schoolManage } = await loadFixture(deploySchoolManageSystem);
      await expect(schoolManage.deleteStudent(0)).to.be.revertedWith(
        "Invalid index supplied"
      );
    });
  });
});
