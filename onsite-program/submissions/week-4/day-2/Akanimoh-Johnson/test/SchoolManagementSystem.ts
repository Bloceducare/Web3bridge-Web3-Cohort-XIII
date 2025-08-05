import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SchoolManagementSystem, SchoolManagementSystem__factory } from "../typechain-types";

describe("SchoolManagementSystem Contract", function () {
  let SchoolManagementSystem: SchoolManagementSystem__factory;
  let school: SchoolManagementSystem;
  let owner: SignerWithAddress;
  const name = "Joshua";
  const age = 50;
  const newName = "Rustacean Josh";
  const newAge = 20;
  const statusDeferred = 1; // DEFERRED

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    SchoolManagementSystem = await ethers.getContractFactory("SchoolManagementSystem");
    school = await SchoolManagementSystem.deploy();
    await school.waitForDeployment();
  });

  describe("register_student", function () {
    it(" register a student", async function () {
      await school.register_student(name, age);
      const student = await school.get_student(0);
      expect(student.id).to.equal(0);
      expect(student.name).to.equal(name);
      expect(student.age).to.equal(age);
      expect(student.status).to.equal(0); // ACTIVE
    });
  });

  describe("update_student", function () {
    it(" update student details", async function () {
      await school.register_student(name, age);
      await school.update_student(0, newName, newAge);
      const student = await school.get_student(0);
      expect(student.name).to.equal(newName);
      expect(student.age).to.equal(newAge);
    });

    it(" revert on invalid index", async function () {
      await expect(school.update_student(0, newName, newAge))
        .to.be.revertedWith("Invalid index");
    });
  });

  describe("update_status", function () {
    it(" update student status", async function () {
      await school.register_student(name, age);
      await school.update_status(0, statusDeferred);
      const student = await school.get_student(0);
      expect(student.status).to.equal(statusDeferred);
    });
  });

  describe("delete_student", function () {
    it(" delete a student", async function () {
      await school.register_student(name, age);
      await school.delete_student(0);
      expect(await school.get_all_students()).to.have.lengthOf(0);
    });
  });

  describe("get_student", function () {
    it(" get student details", async function () {
      await school.register_student(name, age);
      const student = await school.get_student(0);
      expect(student.name).to.equal(name);
      expect(student.age).to.equal(age);
    });

    it(" revert on invalid index", async function () {
      await expect(school.get_student(0))
        .to.be.revertedWith("Invalid index");
    });
  });

  describe("get_all_students", function () {
    it(" return all students", async function () {
      await school.register_student(name, age);
      const students = await school.get_all_students();
      expect(students).to.have.lengthOf(1);
      expect(students[0].name).to.equal(name);
    });
  });
});