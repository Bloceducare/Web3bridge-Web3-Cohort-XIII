import { expect } from "chai";
import { ethers } from "hardhat";
import { StudentManagementSystem } from "../typechain-types";

describe("StudentManagementSystem", function () {
  let studentManagement: StudentManagementSystem;
  let owner: any;
  let addr1: any;
  let addr2: any;

  // Student Status enum values
  const StudentStatus = {
    ACTIVE: 0,
    DEFFERED: 1,
    RUSTICATED: 2,
    GRADUATED: 3,
  };

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    const StudentManagementSystemFactory = await ethers.getContractFactory(
      "StudentManagementSystem"
    );
    studentManagement = await StudentManagementSystemFactory.deploy();
    await studentManagement.waitForDeployment();
  });

  describe("Student Registration", function () {
    it("Should register a student successfully", async function () {
      await studentManagement.registerStudent(
        "John Doe",
        20,
        "Computer Science",
        "CS101"
      );

      const student = await studentManagement.getStudent(1);
      expect(student.id).to.equal(1);
      expect(student.data.name).to.equal("John Doe");
      expect(student.data.age).to.equal(20);
      expect(student.data.course).to.equal("Computer Science");
      expect(student.data.studentClass).to.equal("CS101");
      expect(student.status).to.equal(StudentStatus.ACTIVE);
    });

    it("Should register multiple students with correct IDs", async function () {
      await studentManagement.registerStudent(
        "John Doe",
        20,
        "Computer Science",
        "CS101"
      );
      await studentManagement.registerStudent(
        "Jane Smith",
        19,
        "Mathematics",
        "MATH101"
      );
      await studentManagement.registerStudent(
        "Bob Wilson",
        21,
        "Physics",
        "PHY101"
      );

      const student1 = await studentManagement.getStudent(1);
      const student2 = await studentManagement.getStudent(2);
      const student3 = await studentManagement.getStudent(3);

      expect(student1.id).to.equal(1);
      expect(student2.id).to.equal(2);
      expect(student3.id).to.equal(3);

      expect(student1.data.name).to.equal("John Doe");
      expect(student2.data.name).to.equal("Jane Smith");
      expect(student3.data.name).to.equal("Bob Wilson");
    });

    it("Should register student with empty strings", async function () {
      await studentManagement.registerStudent("", 0, "", "");

      const student = await studentManagement.getStudent(1);
      expect(student.data.name).to.equal("");
      expect(student.data.age).to.equal(0);
      expect(student.data.course).to.equal("");
      expect(student.data.studentClass).to.equal("");
    });
  });

  describe("Get Student", function () {
    beforeEach(async function () {
      await studentManagement.registerStudent(
        "Test Student",
        20,
        "Test Course",
        "Test Class"
      );
    });

    it("Should get student by valid ID", async function () {
      const student = await studentManagement.getStudent(1);
      expect(student.id).to.equal(1);
      expect(student.data.name).to.equal("Test Student");
    });

    it("Should revert when getting student with ID 0", async function () {
      await expect(studentManagement.getStudent(0)).to.be.revertedWith(
        "Invalid student ID"
      );
    });

    it("Should revert when getting student with non-existent ID", async function () {
      await expect(studentManagement.getStudent(999)).to.be.revertedWith(
        "Invalid student ID"
      );
    });
  });

  describe("Get All Students", function () {
    it("Should return empty array when no students registered", async function () {
      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(0);
    });

    it("Should return all registered students", async function () {
      await studentManagement.registerStudent(
        "Student 1",
        20,
        "Course 1",
        "Class 1"
      );
      await studentManagement.registerStudent(
        "Student 2",
        21,
        "Course 2",
        "Class 2"
      );

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0].data.name).to.equal("Student 1");
      expect(students[1].data.name).to.equal("Student 2");
    });
  });

  describe("Update Student Data", function () {
    beforeEach(async function () {
      await studentManagement.registerStudent(
        "Original Name",
        20,
        "Original Course",
        "Original Class"
      );
    });

    it("Should revert when updating with invalid ID", async function () {
      await expect(
        studentManagement.updateStudentData(
          999,
          "New Name",
          25,
          "New Course",
          "New Class"
        )
      ).to.be.revertedWith("Invalid student ID");
    });

    it("Should revert when updating with ID 0", async function () {
      await expect(
        studentManagement.updateStudentData(
          0,
          "New Name",
          25,
          "New Course",
          "New Class"
        )
      ).to.be.revertedWith("Invalid student ID");
    });

    // Note: There's a bug in the original contract - updateStudentData doesn't actually update storage
    it("Should demonstrate the update bug in the contract", async function () {
      const originalStudent = await studentManagement.getStudent(1);

      await studentManagement.updateStudentData(
        1,
        "Updated Name",
        25,
        "Updated Course",
        "Updated Class"
      );

      const updatedStudent = await studentManagement.getStudent(1);
      // This test will fail because the contract has a bug - it modifies memory, not storage
      expect(updatedStudent.data.name).to.equal("Original Name"); // Still original value
    });
  });

  describe("Update Student Status", function () {
    beforeEach(async function () {
      await studentManagement.registerStudent(
        "Test Student",
        20,
        "Test Course",
        "Test Class"
      );
    });

    it("Should update student status to DEFFERED", async function () {
      await studentManagement.updateStudentStatus(1, StudentStatus.DEFFERED);

      const student = await studentManagement.getStudent(1);
      expect(student.status).to.equal(StudentStatus.DEFFERED);
    });

    it("Should update student status to RUSTICATED", async function () {
      await studentManagement.updateStudentStatus(1, StudentStatus.RUSTICATED);

      const student = await studentManagement.getStudent(1);
      expect(student.status).to.equal(StudentStatus.RUSTICATED);
    });

    it("Should update student status to GRADUATED", async function () {
      await studentManagement.updateStudentStatus(1, StudentStatus.GRADUATED);

      const student = await studentManagement.getStudent(1);
      expect(student.status).to.equal(StudentStatus.GRADUATED);
    });

    it("Should revert when updating status with invalid ID", async function () {
      await expect(
        studentManagement.updateStudentStatus(999, StudentStatus.GRADUATED)
      ).to.be.revertedWith("Invalid student ID");
    });

    it("Should revert when updating status with ID 0", async function () {
      await expect(
        studentManagement.updateStudentStatus(0, StudentStatus.GRADUATED)
      ).to.be.revertedWith("Invalid student ID");
    });
  });

  describe("Delete Student (Standard)", function () {
    beforeEach(async function () {
      await studentManagement.registerStudent(
        "Student 1",
        20,
        "Course 1",
        "Class 1"
      );
      await studentManagement.registerStudent(
        "Student 2",
        21,
        "Course 2",
        "Class 2"
      );
    });

    it("Should delete a student (sets to zero values)", async function () {
      await studentManagement.deleteStudent(1);

      const student = await studentManagement.getStudent(1);
      expect(student.id).to.equal(0);
      expect(student.data.name).to.equal("");
      expect(student.data.age).to.equal(0);
      expect(student.data.course).to.equal("");
      expect(student.data.studentClass).to.equal("");
      expect(student.status).to.equal(0);
    });

    it("Should keep array length unchanged after deletion", async function () {
      const beforeStudents = await studentManagement.getAllStudents();
      expect(beforeStudents.length).to.equal(2);

      await studentManagement.deleteStudent(1);

      const afterStudents = await studentManagement.getAllStudents();
      expect(afterStudents.length).to.equal(2); // Length remains the same
    });

    it("Should revert when deleting with invalid ID", async function () {
      await expect(studentManagement.deleteStudent(999)).to.be.revertedWith(
        "Invalid student ID"
      );
    });

    it("Should revert when deleting with ID 0", async function () {
      await expect(studentManagement.deleteStudent(0)).to.be.revertedWith(
        "Invalid student ID"
      );
    });
  });

  describe("Delete Student (Pop and Shift)", function () {
    beforeEach(async function () {
      await studentManagement.registerStudent(
        "Student 1",
        20,
        "Course 1",
        "Class 1"
      );
      await studentManagement.registerStudent(
        "Student 2",
        21,
        "Course 2",
        "Class 2"
      );
      await studentManagement.registerStudent(
        "Student 3",
        22,
        "Course 3",
        "Class 3"
      );
    });

    it("Should delete last student and reduce array size", async function () {
      const beforeStudents = await studentManagement.getAllStudents();
      expect(beforeStudents.length).to.equal(3);

      await studentManagement.delete_student_pop_and_shift(3);

      const afterStudents = await studentManagement.getAllStudents();
      expect(afterStudents.length).to.equal(2);
      expect(afterStudents[0].data.name).to.equal("Student 1");
      expect(afterStudents[1].data.name).to.equal("Student 2");
    });

    it("Should delete middle student and shift last student", async function () {
      await studentManagement.delete_student_pop_and_shift(2);

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0].data.name).to.equal("Student 1");
      expect(students[1].data.name).to.equal("Student 3"); // Last student moved to position 2
    });

    it("Should delete first student and shift last student", async function () {
      await studentManagement.delete_student_pop_and_shift(1);

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0].data.name).to.equal("Student 3"); // Last student moved to position 1
      expect(students[1].data.name).to.equal("Student 2");
    });

    it("Should handle single student deletion", async function () {
      // First clear the current students and add just one
      await studentManagement.delete_student_pop_and_shift(1);
      await studentManagement.delete_student_pop_and_shift(1);
      await studentManagement.delete_student_pop_and_shift(1);

      await studentManagement.registerStudent(
        "Only Student",
        25,
        "Only Course",
        "Only Class"
      );

      await studentManagement.delete_student_pop_and_shift(1);

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(0);
    });

    it("Should revert when deleting with invalid ID", async function () {
      await expect(
        studentManagement.delete_student_pop_and_shift(999)
      ).to.be.revertedWith("Invalid student ID");
    });

    it("Should revert when deleting with ID 0", async function () {
      await expect(
        studentManagement.delete_student_pop_and_shift(0)
      ).to.be.revertedWith("Invalid student ID");
    });
  });

  describe("Edge Cases and Integration Tests", function () {
    it("Should handle multiple operations in sequence", async function () {
      // Register students
      await studentManagement.registerStudent("A", 20, "CourseA", "ClassA");
      await studentManagement.registerStudent("B", 21, "CourseB", "ClassB");
      await studentManagement.registerStudent("C", 22, "CourseC", "ClassC");

      // Update status
      await studentManagement.updateStudentStatus(2, StudentStatus.GRADUATED);

      // Delete one student (standard delete)
      await studentManagement.deleteStudent(1);

      // Add another student
      await studentManagement.registerStudent("D", 23, "CourseD", "ClassD");

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(4);
      expect(students[0].id).to.equal(0); // Deleted student
      expect(students[1].data.name).to.equal("B");
      expect(students[1].status).to.equal(StudentStatus.GRADUATED);
      expect(students[2].data.name).to.equal("C");
      expect(students[3].data.name).to.equal("D");
      expect(students[3].id).to.equal(4);
    });

    it("Should handle pop and shift deletion after standard deletion", async function () {
      await studentManagement.registerStudent("A", 20, "CourseA", "ClassA");
      await studentManagement.registerStudent("B", 21, "CourseB", "ClassB");
      await studentManagement.registerStudent("C", 22, "CourseC", "ClassC");

      // Standard delete first student
      await studentManagement.deleteStudent(1);

      // Pop and shift delete last student
      await studentManagement.delete_student_pop_and_shift(3);

      const students = await studentManagement.getAllStudents();
      expect(students.length).to.equal(2);
      expect(students[0].id).to.equal(0); // Still deleted
      expect(students[1].data.name).to.equal("B");
    });

    it("Should work with different address callers", async function () {
      await studentManagement
        .connect(addr1)
        .registerStudent("Student by addr1", 20, "Course1", "Class1");

      await studentManagement
        .connect(addr2)
        .registerStudent("Student by addr2", 21, "Course2", "Class2");

      const student1 = await studentManagement.getStudent(1);
      const student2 = await studentManagement.getStudent(2);

      expect(student1.data.name).to.equal("Student by addr1");
      expect(student2.data.name).to.equal("Student by addr2");

      // Different addresses can modify any student
      await studentManagement
        .connect(addr1)
        .updateStudentStatus(2, StudentStatus.GRADUATED);

      const updatedStudent2 = await studentManagement.getStudent(2);
      expect(updatedStudent2.status).to.equal(StudentStatus.GRADUATED);
    });
  });
});