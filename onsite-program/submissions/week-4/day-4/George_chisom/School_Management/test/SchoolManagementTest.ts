import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagement", function () {
  async function deploySchoolManagement() {
    const SchoolManagement = await hre.ethers.getContractFactory(
      "SchoolManagement"
    );

    const [admin, otherAccount] = await hre.ethers.getSigners();

    const schoolManagement = await SchoolManagement.deploy();

    return { schoolManagement, admin, otherAccount };
  }

  describe("Add Student", function () {
    it("should add a student successfully", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const studentName = "Felix David";
      const studentCourse = "Physics";
      const studentAge = 20;
      const StudentAddress = otherAccount.address;

      await schoolManagement.register_student(
        studentName,
        studentCourse,
        studentAge,
        StudentAddress
      );

      const studentData = await schoolManagement.get_all_students();

      const student = studentData[0];

      expect(student.name).to.equal(studentName);
    });
  });

  describe("Get All Students", function () {
    it("should retrieve a student's details", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const studentName = "Felix David";
      const studentCourse = "Physics";
      const studentAge = 20;
      const StudentAddress = otherAccount.address;

      await schoolManagement.register_student(
        studentName,
        studentCourse,
        studentAge,
        StudentAddress
      );

      const studentData = await schoolManagement.get_all_students();

      const all_students = studentData.length;

      expect(all_students).to.equal(all_students);
    });
  });

  describe("Update Student", function () {
    it("this updates a students data", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const student_name = "David Clean";

      await schoolManagement.update_student(otherAccount.address, student_name);

      const studentData = await schoolManagement.get_student_by_id(
        otherAccount.address
      );

      expect(studentData.name).to.equals(student_name);
    });
  });

  describe("Get A Student", function () {
    it("this is to get a students data", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const studentData = await schoolManagement.get_student_by_id(
        otherAccount.address
      );

      expect(studentData).to.equals(studentData);
    });
  });

  describe("Update Status", function () {
    it("this updates a students status", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const student_status = 1;

      await schoolManagement.update_students_status(
        otherAccount.address,
        student_status
      );

      const studentData = await schoolManagement.get_student_by_id(
        otherAccount.address
      );

      expect(studentData.status).to.equals(student_status);
    });
  });

  describe("Remove Student", function () {
    it("should remove a student successfully", async function () {
      const { schoolManagement, otherAccount } = await loadFixture(
        deploySchoolManagement
      );

      const student_data = await schoolManagement.get_all_students();

      await schoolManagement.delete_student(otherAccount.address);

      const new_data = student_data.length;

      expect(new_data).to.equals(new_data);
    });
  });
});
