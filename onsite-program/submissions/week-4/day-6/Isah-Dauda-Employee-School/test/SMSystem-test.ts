import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem", function () {
  async function deployFixture() {
    const [isah, otherUser] = await hre.ethers.getSigners();
    const Contract = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const school = await Contract.deploy();
    return { school, isah, otherUser };
  }

  it("Should register student successfully", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    const student = await school.getStudent();
    expect(student.name).to.equal("Trinnex Trinnode");
    expect(student.age).to.equal(22);
    expect(student.gender).to.equal("Male");
    expect(student.status).to.equal(0); // ACTIVE
  });

  it("Should revert if student is already registered", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    await expect(
      school.registerStudent("Trinnex Trinnode", 22, "Male")
    ).to.be.revertedWithCustomError(school, "AlreadyRegistered");
  });

  it("Should update student name and age", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    await school.updateStudent("Isah Dauda", 23);
    const student = await school.getStudent();
    expect(student.name).to.equal("Isah Dauda");
    expect(student.age).to.equal(23);
  });

  it("Should update student status", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    await school.updateStatus(1); // DEFERRED
    const status = await school.getStatus();
    expect(status).to.equal(1);
  });

  it("Should get student info", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    const student = await school.getStudent();
    expect(student.name).to.equal("Trinnex Trinnode");
  });

  it("Should get student status", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    expect(await school.getStatus()).to.equal(0); // ACTIVE
  });

  it("Should delete student", async () => {
    const { school } = await loadFixture(deployFixture);
    await school.registerStudent("Trinnex Trinnode", 22, "Male");
    await school.deleteStudent();
    await expect(school.getStudent()).to.be.revertedWithCustomError(school, "NotRegistered");
  });

  it("Should revert if unregistered student tries to update or view", async () => {
    const { school } = await loadFixture(deployFixture);
    await expect(school.updateStudent("Name", 20)).to.be.revertedWithCustomError(school, "NotRegistered");
    await expect(school.getStudent()).to.be.revertedWithCustomError(school, "NotRegistered");
    await expect(school.updateStatus(1)).to.be.revertedWithCustomError(school, "NotRegistered");
    await expect(school.getStatus()).to.be.revertedWithCustomError(school, "NotRegistered");
    await expect(school.deleteStudent()).to.be.revertedWithCustomError(school, "NotRegistered");
  });
});
