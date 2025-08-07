import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Smanagement", function () {
  async function deploySmanagement() {
    const Smanagement = await hre.ethers.getContractFactory("Smanagement");
    const smanagement = await Smanagement.deploy();
    return { smanagement };
  }

  it("Should register a student", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await smanagement.studentReg("Alice", "alice@email.com", 21);
    const student = await smanagement.getStudent(1);
    expect(student.name).to.equal("Alice");
    expect(student.email).to.equal("alice@email.com");
    expect(student.age).to.equal(21);
    expect(student.status).to.equal(0); // ACTIVE
  });

  it("Should update a student's details", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await smanagement.studentReg("Bob", "bob@email.com", 22);
    await smanagement.updateStudent(1, "Bobby", "bobby@email.com", 23);
    const student = await smanagement.getStudent(1);
    expect(student.name).to.equal("Bobby");
    expect(student.email).to.equal("bobby@email.com");
    expect(student.age).to.equal(23);
  });

  it("Should delete a student", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await smanagement.studentReg("Carol", "carol@email.com", 24);
    await smanagement.deleteStudent(1);
    await expect(smanagement.getStudent(1)).to.be.revertedWith("Invalid");
    const allStudents = await smanagement.locateAllStudents();
    expect(allStudents.length).to.equal(0);
  });

  it("Should change a student's status", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await smanagement.studentReg("Dave", "dave@email.com", 25);
    // 1 = DEFERRED
    await smanagement.changeStatus(1, 1);
    let student = await smanagement.getStudent(1);
    expect(student.status).to.equal(1);
    // 2 = RUSTICATED
    await smanagement.changeStatus(1, 2);
    student = await smanagement.getStudent(1);
    expect(student.status).to.equal(2);
  });

  it("Should return all students", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await smanagement.studentReg("Eve", "eve@email.com", 26);
    await smanagement.studentReg("Frank", "frank@email.com", 27);
    const allStudents = await smanagement.locateAllStudents();
    expect(allStudents.length).to.equal(2);
    expect(allStudents[0].name).to.equal("Eve");
    expect(allStudents[1].name).to.equal("Frank");
  });

  it("Should revert when getting a non-existent student", async function () {
    const { smanagement } = await loadFixture(deploySmanagement);
    await expect(smanagement.getStudent(999)).to.be.revertedWith("Invalid");
  });
});