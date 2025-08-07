import { expect } from "chai";
import { ethers } from "hardhat";
import { SchoolManagementSystem } from "../typechain-types";

describe("SchoolManagementSystem", function () {
  let schoolManagement: SchoolManagementSystem;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    
    [owner, addr1, addr2] = await ethers.getSigners();

    const SchoolManagementSystemFactory = await ethers.getContractFactory("SchoolManagementSystem");
    schoolManagement = await SchoolManagementSystemFactory.deploy();
    await schoolManagement.waitForDeployment();
  });

  describe("Student Registration", function () {
    it("Should register a new student successfully", async function () {
      const studentName = "John Doe";
      const studentAge = 20;

      const tx = await schoolManagement.registerStudent(studentName, studentAge);
      const receipt = await tx.wait();

      const student = await schoolManagement.getStudent(1);
      expect(student[0]).to.equal(1);
      expect(student[1]).to.equal(studentName);
      expect(student[2]).to.equal(studentAge); 
      expect(student[3]).to.equal(0); 
    });

    it("Should increment nextId after registration", async function () {
      await schoolManagement.registerStudent("Student 1", 18);
      await schoolManagement.registerStudent("Student 2", 19);

      const nextId = await schoolManagement.nextId();
      expect(nextId).to.equal(3);
    });

   
  });

  describe("Student Updates", function () {
    beforeEach(async function () {
      await schoolManagement.registerStudent("Original Name", 18);
    });

    it("Should update student information successfully", async function () {
      const newName = "Updated Name";
      const newAge = 20;

      await schoolManagement.updateStudent(1, newName, newAge);

      const student = await schoolManagement.getStudent(1);
      expect(student[1]).to.equal(newName);
      expect(student[2]).to.equal(newAge);
    });

    it("Should not update non-existent student", async function () {
      const newName = "Updated Name";
      const newAge = 20;

      await schoolManagement.updateStudent(999, newName, newAge);

      const student = await schoolManagement.getStudent(999);
      expect(student[0]).to.equal(0); // Should return default values
    });

    it("Should not update deleted student", async function () {
      await schoolManagement.deleteStudent(1);
      await schoolManagement.updateStudent(1, "New Name", 21);

      const student = await schoolManagement.getStudent(1);
      expect(student[0]).to.equal(0); // Should return default values
    });
  });

  describe("Student Deletion", function () {
    beforeEach(async function () {
      await schoolManagement.registerStudent("To Delete", 18);
    });

    it("Should delete student successfully", async function () {
      await schoolManagement.deleteStudent(1);

      const exists = await schoolManagement.studentExists(1);
      expect(exists).to.be.false;
    });

    it("Should not delete non-existent student", async function () {
      await schoolManagement.deleteStudent(999);
    });

    it("Should not delete already deleted student", async function () {
      await schoolManagement.deleteStudent(1);
      await schoolManagement.deleteStudent(1);
    });
  });

  describe("Status Changes", function () {
    beforeEach(async function () {
      await schoolManagement.registerStudent("Test Student", 18);
    });

    it("Should change student status to DEFERRED", async function () {
      await schoolManagement.changeStudentStatus(1, 1); // DEFERRED = 1

      const student = await schoolManagement.getStudent(1);
      expect(student[3]).to.equal(1); // DEFERRED status
    });

    it("Should change student status to RUSTICATED", async function () {
      await schoolManagement.changeStudentStatus(1, 2); // RUSTICATED = 2

      const student = await schoolManagement.getStudent(1);
      expect(student[3]).to.equal(2); // RUSTICATED status
    });

    it("Should change student status back to ACTIVE", async function () {
      await schoolManagement.changeStudentStatus(1, 1); // DEFERRED
      await schoolManagement.changeStudentStatus(1, 0); // ACTIVE

      const student = await schoolManagement.getStudent(1);
      expect(student[3]).to.equal(0); // ACTIVE status
    });

    it("Should not change status of non-existent student", async function () {
      await schoolManagement.changeStudentStatus(999, 1);
    });
  });

  describe("Student Retrieval", function () {
    beforeEach(async function () {
      await schoolManagement.registerStudent("Alice", 18);
      await schoolManagement.registerStudent("Bob", 19);
      await schoolManagement.registerStudent("Charlie", 20);
    });

    it("Should get student by ID", async function () {
      const student = await schoolManagement.getStudent(2);
      expect(student[0]).to.equal(2); 
      expect(student[1]).to.equal("Bob"); 
      expect(student[2]).to.equal(19); 
      expect(student[3]).to.equal(0); 
    });

    it("Should return default values for non-existent student", async function () {
      const student = await schoolManagement.getStudent(999);
      expect(student[0]).to.equal(0); 
      expect(student[1]).to.equal(""); 
      expect(student[2]).to.equal(0); 
      expect(student[3]).to.equal(0);
    });

    it("Should return default values for deleted student", async function () {
      await schoolManagement.deleteStudent(1);
      const student = await schoolManagement.getStudent(1);
      expect(student[0]).to.equal(0);
      expect(student[1]).to.equal("");
      expect(student[2]).to.equal(0); 
      expect(student[3]).to.equal(0); 
    });

    it("Should get all students", async function () {
      const allStudents = await schoolManagement.getAllStudents();
      expect(allStudents.length).to.equal(3);
    });
  });

  describe("Student Existence Checks", function () {
    beforeEach(async function () {
      await schoolManagement.registerStudent("Test Student", 18);
    });

    it("Should return true for existing student", async function () {
      const exists = await schoolManagement.studentExists(1);
      expect(exists).to.be.true;
    });

    it("Should return false for non-existent student", async function () {
      const exists = await schoolManagement.studentExists(999);
      expect(exists).to.be.false;
    });

    it("Should return false for deleted student", async function () {
      await schoolManagement.deleteStudent(1);
      const exists = await schoolManagement.studentExists(1);
      expect(exists).to.be.false;
    });
  });

}); 