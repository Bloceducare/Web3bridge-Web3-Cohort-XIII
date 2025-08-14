import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

import { ethers } from "hardhat";
import { SchoolManagement } from "../typechain-types";

describe("SchoolManagement", function () {
  let schoolManagement: SchoolManagement;

  beforeEach(async function () {
    const SchoolManagement = await ethers.getContractFactory("SchoolManagement");
    schoolManagement = await SchoolManagement.deploy();
    await schoolManagement.waitForDeployment();
  });

  it("should register a new student", async function () {
    await schoolManagement.registerStudent("Alice", 20);
    const [id, name, age, status, exists] = await schoolManagement.getStudent(0);
    expect(name).to.equal("Alice");
    expect(age).to.equal(20);
    expect(status).to.equal(0); // ACTIVE
    expect(exists).to.be.true;
  });

  it("should update student details", async function () {
    await schoolManagement.registerStudent("Bob", 22);
    await schoolManagement.updateStudent(0, "Bob Updated", 23, 1); // DEFERRED
    const [id, name, age, status, exists] = await schoolManagement.getStudent(0);
    expect(name).to.equal("Bob Updated");
    expect(age).to.equal(23);
    expect(status).to.equal(1); // DEFERRED
  });

  it("should delete a student", async function () {
    await schoolManagement.registerStudent("Charlie", 25);
    await schoolManagement.deleteStudent(0);
    // Check deletion by attempting to get student and expecting a revert
    await expect(schoolManagement.getStudent(0)).to.be.revertedWith("Student does not exist");
  });

  it("should return all students", async function () {
    await schoolManagement.registerStudent("Dave", 21);
    await schoolManagement.registerStudent("Eve", 19);
    const students = await schoolManagement.getAllStudents();
    expect(students.length).to.equal(2);
  });
});