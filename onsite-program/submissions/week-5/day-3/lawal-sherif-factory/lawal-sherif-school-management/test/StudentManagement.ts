import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("StudentManagement", function () {
  async function deployStudentManagement() {
    const StudentManagement = await hre.ethers.getContractFactory(
      "StudentManagement"
    );
    const studentManagement = await StudentManagement.deploy();

    return { studentManagement };
  }
  describe("Student Registration and management", function () {
    it("Should register a student correctly", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      await studentManagement.register_student(name, age, gender);

      const student_length = await studentManagement.get_students();

      const get_student_details = student_length[0];

      expect(get_student_details.name).to.equal(name);
      expect(get_student_details.age).to.equal(age);
      expect(get_student_details.gender).to.equal(gender);
    });

    it("Should update a student's data correctly", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const id = 0;

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      const status = 0;

      await studentManagement.register_student(name, age, gender);
      await studentManagement.update_student(id, name, age, gender, status);

      const student_length = await studentManagement.get_students();

      const get_student_details = student_length[0];

      expect(get_student_details.id).to.equal(id);
      expect(get_student_details.name).to.equal(name);
      expect(get_student_details.age).to.equal(age);
      expect(get_student_details.gender).to.equal(gender);
      expect(get_student_details.status).to.equal(status);
    });

    it("Should get all student's data", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const id = 0;

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      const status = 0;

      await studentManagement.register_student(name, age, gender);
      await studentManagement.get_students();

      const student_length = await studentManagement.get_students();

      const get_student_details = student_length[0];

      const getStudent = await studentManagement.get_students();
      expect(getStudent).to.be.an("array");
      expect(getStudent).to.lengthOf(1);
    });

    it("Should update a student's data correctly using index", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const id = 0;

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      const status = 0;

      await studentManagement.register_student(name, age, gender);
      const studentData = await studentManagement.get_student(id);

      const student_length = await studentManagement.get_students();

      const get_student_details = student_length[0];

      expect(studentData.id).to.equal(id);
      expect(studentData.name).to.equal(name);
      expect(studentData.age).to.equal(age);
      expect(studentData.gender).to.equal(gender);
      expect(studentData.status).to.equal(status);
    });

    it("Should delete a student's data correctly using index", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const id = 0;

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      const status = 0;

      await studentManagement.register_student(name, age, gender);

      await studentManagement.delete_student(id);
      // const studentData = await studentManagement.get_student(id);
      const deletedStudent = await studentManagement.get_student(id);

      const student_length = await studentManagement.get_students();

      // const get_student_details = student_length[0];

      expect(deletedStudent.id).to.equal(0);
      expect(deletedStudent.name).to.equal("");
      expect(deletedStudent.age).to.equal(0);
      expect(deletedStudent.gender).to.equal(0);
      expect(deletedStudent.status).to.equal(0);

      const allStudents = await studentManagement.get_students();
      expect(allStudents).to.have.lengthOf(1);
    });

    it("Should change a student's status correctly using index", async function () {
      const { studentManagement } = await loadFixture(deployStudentManagement);

      const [owner, studentSigner] = await hre.ethers.getSigners();

      const id = 0;

      const name = "Sherif";

      const age = 50;

      const gender = 0;

      const status = 0;

      await studentManagement.register_student(name, age, gender);

      await studentManagement.change_student_status(id, status);

      const changeStudent = await studentManagement.get_student(id);

      const student_length = await studentManagement.get_students();

      // const get_student_details = student_length[0];

      expect(changeStudent.id).to.equal(id);
      expect(changeStudent.name).to.equal(name);
      expect(changeStudent.status).to.equal(status);

      // const allStudents = await studentManagement.get_students();
      // expect(allStudents).to.have.lengthOf(1);
    });
  });
});
