import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySchoolManagementSystem() {
    const SchoolManagementSystem = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const school = await SchoolManagementSystem.deploy();

    return { school };
  }

  describe("School Deployment", function () {
    it("Should register student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      const name = "Deby"

      const age = 14

      const email = "deboraholaboye@gmail.com"

      const gender = 1

      const status = 0

      await school.RegisterStudent(name, age, email, gender, status);

      const student = await school.ViewStudents();

      const get_students = student[0];

      expect(get_students.name).to.equal(name);
      expect(get_students.age).to.equal(age);
      expect(get_students.email).to.equal(email);
      expect(get_students.gender).to.equal(gender);
      expect(get_students.status).to.equal(status);
    });

    it("Should update student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      const name = "Deby"

      const age = 14

      const email = "deboraholaboye@gmail.com"

      const gender = 1

      const status = 0

      await school.RegisterStudent(name, age, email, gender, status);

      const new_name = "Deborah"

      const new_age = 18

      await school.UpdateStudent(0, new_name, new_age);

      const student = await school.ViewStudents();

      const updated_student = student[0];

      expect(updated_student.name).to.equal(new_name);
      expect(updated_student.age).to.equal(new_age);
    });

    it("Should delete student", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      const name = "Deby"

      const age = 14

      const email = "deboraholaboye@gmail.com"

      const gender = 1

      const status = 0

      await school.RegisterStudent(name, age, email, gender, status);

      await school.DeleteStudent(0);

      const students = await school.ViewStudents();

      expect (students.length).to.equal(0);
    });

    it("Should change student status", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      const name = "Deby"

      const age = 14

      const email = "deboraholaboye@gmail.com"

      const gender = 1

      const status = 0

      await school.RegisterStudent(name, age, email, gender, status);

      const new_status = 2

      await school.ChangeStatus(0, new_status);

      const student = await school.ViewStudents();

      const updated_student = student[0];

      expect (updated_student.status).to.equal(new_status);

    });

    it("Should get student by id", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      const name = "Deby"

      const age = 14

      const email = "deboraholaboye@gmail.com"

      const gender = 1

      const status = 0

      await school.RegisterStudent(name, age, email, gender, status);

      await school.ViewStudent(0);

      const student = await school.ViewStudents();

      const get_student = student[0];

      expect (get_student.name).to.equal(name);
      expect (get_student.age).to.equal(age);
      expect (get_student.email).to.equal(email);
      expect (get_student.gender).to.equal(gender);
      expect (get_student.status).to.equal(status);
    });

    it("Should get all students", async function () {
      const { school } = await loadFixture(deploySchoolManagementSystem);

      await school.RegisterStudent("Deby", 14, "deby@gmail.com", 1, 0);

      await school.RegisterStudent("John", 14, "john@gmail.com", 0, 1);

      await school.ViewStudents();

      const student = await school.ViewStudents();

      expect (student.length).to.equal(2);
    });
  });
});
