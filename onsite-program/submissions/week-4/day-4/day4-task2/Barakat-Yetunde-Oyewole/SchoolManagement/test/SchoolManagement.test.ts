import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StudentManagementSystem, StudentManagementSystem__factory } from "../typechain-types";

describe("StudentManagementSystem", function () {
  let studentManagementSystem: StudentManagementSystem;
  let owner: SignerWithAddress;
  let student1: SignerWithAddress;
  let student2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  before(async function () {
    [owner, student1, student2, unauthorized] = await ethers.getSigners();
    const StudentManagementSystemFactory = (await ethers.getContractFactory(
      "StudentManagementSystem"
    )) as StudentManagementSystem__factory;
    studentManagementSystem = await StudentManagementSystemFactory.deploy();
    await studentManagementSystem.waitForDeployment();
  });

  describe("registerStudent", function () {
    it("should register a new student", async function () {
      await expect(
        studentManagementSystem.registerStudent(
          student1.address,
          "Alice",
          20,
          "Computer Science",
          2
        )
      ).to.not.be.reverted;

      const student = await studentManagementSystem.getStudent(student1.address);
      expect(student.name).to.equal("Alice");
      expect(student.age).to.equal(20);
      expect(student.course).to.equal("Computer Science");
      expect(student.yearOfStudy).to.equal(2);
      expect(student.status).to.equal(0); // Active
      expect(student.creator).to.equal(owner.address);
    });

    it("should fail when registering an existing student", async function () {
      await expect(
        studentManagementSystem.registerStudent(
          student1.address,
          "Alice",
          20,
          "Computer Science",
          2
        )
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "STUDENT_ALREADY_EXISTS"
      );
    });

    it("should fail with empty name", async function () {
      await expect(
        studentManagementSystem.registerStudent(
          student2.address,
          "",
          21,
          "Mathematics",
          1
        )
      ).to.be.revertedWithCustomError(studentManagementSystem, "INVALID_INPUT");
    });

    it("should fail with empty course", async function () {
      await expect(
        studentManagementSystem.registerStudent(
          student2.address,
          "Bob",
          21,
          "",
          1
        )
      ).to.be.revertedWithCustomError(studentManagementSystem, "INVALID_INPUT");
    });

    it("should fail with zero age", async function () {
      await expect(
        studentManagementSystem.registerStudent(
          student2.address,
          "Bob",
          0,
          "Mathematics",
          1
        )
      ).to.be.revertedWithCustomError(studentManagementSystem, "INVALID_INPUT");
    });
  });

  describe("updateStudentInfo", function () {
    it("should update student information", async function () {
      await studentManagementSystem.registerStudent(
        student2.address,
        "Bob",
        21,
        "Mathematics",
        1
      );

      await expect(
        studentManagementSystem.updateStudentInfo(
          student2.address,
          "Robert",
          22,
          "Applied Mathematics",
          2
        )
      ).to.not.be.reverted;

      const student = await studentManagementSystem.getStudent(student2.address);
      expect(student.name).to.equal("Robert");
      expect(student.age).to.equal(22);
      expect(student.course).to.equal("Applied Mathematics");
      expect(student.yearOfStudy).to.equal(2);
    });

    it("should fail when updating non-existent student", async function () {
      await expect(
        studentManagementSystem.updateStudentInfo(
          unauthorized.address,
          "Charlie",
          23,
          "Physics",
          3
        )
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "STUDENT_NOT_FOUND"
      );
    });

    it("should fail when unauthorized user tries to update", async function () {
      await expect(
        studentManagementSystem
          .connect(unauthorized)
          .updateStudentInfo(student2.address, "Hacked", 0, "Hacking", 0)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "UNAUTHORIZED_ACCESS"
      );
    });

    it("should fail with empty name", async function () {
      await expect(
        studentManagementSystem.updateStudentInfo(
          student2.address,
          "",
          22,
          "Applied Mathematics",
          2
        )
      ).to.be.revertedWithCustomError(studentManagementSystem, "INVALID_INPUT");
    });

    it("should fail with empty course", async function () {
      await expect(
        studentManagementSystem.updateStudentInfo(
          student2.address,
          "Robert",
          22,
          "",
          2
        )
      ).to.be.revertedWithCustomError(studentManagementSystem, "INVALID_INPUT");
    });
  });

  describe("updateStudentStatus", function () {
    it("should update student status", async function () {
      await expect(
        studentManagementSystem.updateStudentStatus(student2.address, 1) // Deferred
      ).to.not.be.reverted;

      const student = await studentManagementSystem.getStudent(student2.address);
      expect(student.status).to.equal(1); // Deferred
    });

    it("should fail when updating non-existent student", async function () {
      await expect(
        studentManagementSystem.updateStudentStatus(unauthorized.address, 0)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "STUDENT_NOT_FOUND"
      );
    });

    it("should fail when unauthorized user tries to update", async function () {
      await expect(
        studentManagementSystem
          .connect(unauthorized)
          .updateStudentStatus(student2.address, 0)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "UNAUTHORIZED_ACCESS"
      );
    });
  });

  describe("getAllStudents", function () {
    it("should return all registered students", async function () {
      const students = await studentManagementSystem.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0].name).to.equal("Alice");
      expect(students[1].name).to.equal("Robert");
    });
  });

  describe("getAllStudentAddresses", function () {
    it("should return all registered student addresses", async function () {
      const addresses = await studentManagementSystem.getAllStudentAddresses();
      expect(addresses.length).to.equal(2);
      expect(addresses).to.include(student1.address);
      expect(addresses).to.include(student2.address);
    });
  });

  describe("deleteStudent", function () {
    it("should delete a student", async function () {
      await expect(
        studentManagementSystem.deleteStudent(student2.address)
      ).to.not.be.reverted;

      await expect(
        studentManagementSystem.getStudent(student2.address)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "STUDENT_NOT_FOUND"
      );

      const students = await studentManagementSystem.getAllStudents();
      expect(students.length).to.equal(1);
    });

    it("should fail when deleting non-existent student", async function () {
      await expect(
        studentManagementSystem.deleteStudent(student2.address)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "STUDENT_NOT_FOUND"
      );
    });

    it("should fail when unauthorized user tries to delete", async function () {
      await expect(
        studentManagementSystem.connect(unauthorized).deleteStudent(student1.address)
      ).to.be.revertedWithCustomError(
        studentManagementSystem,
        "UNAUTHORIZED_ACCESS"
      );
    });
  });
});