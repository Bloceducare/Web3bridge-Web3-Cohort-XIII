// SPDX-License-Identifier: MIT
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TeacherManagement", function () {
  async function deployTeacherManagementFixture() {
    const [owner, user1, user2, admin] = await hre.ethers.getSigners();

    const TeacherManagement = await hre.ethers.getContractFactory("TeacherManagement");
    const teacherManagement = await TeacherManagement.deploy();

    return { teacherManagement, owner, user1, user2, admin };
  }

  describe("Deployment", function () {
    it("Should deploy without errors", async function () {
      const { teacherManagement } = await loadFixture(deployTeacherManagementFixture);
      expect(teacherManagement).to.not.be.undefined;
    });
  });

  describe("User Registration", function () {
    it("Should register a new user successfully", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const name = "John Doe";
      const userType = 0; // MENTOR
      const agreedSalary = hre.ethers.parseEther("1");

      await expect(teacherManagement.connect(user1).registerUser(name, userType, agreedSalary))
        .to.emit(teacherManagement, "UserRegistered")
        .withArgs(user1.address, 0, name, userType, agreedSalary);

      const user = await teacherManagement.getUser(0);
      expect(user.id).to.equal(0);
      expect(user.name).to.equal(name);
      expect(user.userType).to.equal(userType);
      expect(user.isEmployed).to.be.true;
      expect(user.agreedSalary).to.equal(agreedSalary);
      expect(user.totalPaid).to.equal(0);
      expect(user.exists).to.be.true;
    });

    // Skip zero address test as it's not feasible in Hardhat
    it("Should revert if name is empty", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      await expect(
        teacherManagement.connect(user1).registerUser("", 0, hre.ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(teacherManagement, "NameCannotBeEmpty");
    });

    it("Should revert if salary is zero", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      await expect(
        teacherManagement.connect(user1).registerUser("John Doe", 0, 0)
      ).to.be.revertedWithCustomError(teacherManagement, "InvalidSalaryAmount");
    });

    it("Should revert if user is already registered", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const name = "John Doe";
      const userType = 0;
      const agreedSalary = hre.ethers.parseEther("1");

      await teacherManagement.connect(user1).registerUser(name, userType, agreedSalary);
      await expect(
        teacherManagement.connect(user1).registerUser(name, userType, agreedSalary)
      ).to.be.revertedWithCustomError(teacherManagement, "UserAlreadyRegistered").withArgs(user1.address);
    });
  });

  describe("User Update", function () {
    it("Should update user details successfully", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const name = "John Doe";
      const newName = "Jane Doe";
      const userType = 0;
      const agreedSalary = hre.ethers.parseEther("1");
      const newSalary = hre.ethers.parseEther("2");

      await teacherManagement.connect(user1).registerUser(name, userType, agreedSalary);
      await expect(teacherManagement.connect(user1).updateUser(0, newName, newSalary))
        .to.emit(teacherManagement, "UserUpdated")
        .withArgs(user1.address, 0, newName, newSalary);

      const user = await teacherManagement.getUser(0);
      expect(user.name).to.equal(newName);
      expect(user.agreedSalary).to.equal(newSalary);
    });

    it("Should revert if user does not exist", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      await expect(
        teacherManagement.connect(user1).updateUser(999, "Jane Doe", hre.ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(teacherManagement, "UserNotFound").withArgs(999);
    });

    it("Should revert if sender is not the user", async function () {
      const { teacherManagement, user1, user2 } = await loadFixture(deployTeacherManagementFixture);
      await teacherManagement.connect(user1).registerUser("John Doe", 0, hre.ethers.parseEther("1"));
      await expect(
        teacherManagement.connect(user2).updateUser(0, "Jane Doe", hre.ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(teacherManagement, "UserNotFound").withArgs(0);
    });
  });

  describe("User Termination", function () {
    it("Should terminate user successfully", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      await teacherManagement.connect(user1).registerUser("John Doe", 0, hre.ethers.parseEther("1"));
      await expect(teacherManagement.connect(user1).terminateUser(0))
        .to.emit(teacherManagement, "UserTerminated")
        .withArgs(user1.address, 0);

      const user = await teacherManagement.getUser(0);
      expect(user.isEmployed).to.be.false;
    });

    it("Should revert if user does not exist", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      await expect(
        teacherManagement.connect(user1).terminateUser(999)
      ).to.be.revertedWithCustomError(teacherManagement, "UserNotFound").withArgs(999);
    });
  });

  describe("Salary Disbursement", function () {
    it("Should disburse salary successfully", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const agreedSalary = hre.ethers.parseEther("1");
      const amount = hre.ethers.parseEther("0.5");

      await teacherManagement.connect(user1).registerUser("John Doe", 0, agreedSalary);
      const tx = teacherManagement.connect(user1).disburseSalary(0, amount, { value: amount });
      await expect(tx).to.emit(teacherManagement, "SalaryDisbursed").withArgs(user1.address, 0, amount);
      await expect(tx).to.changeEtherBalances([user1, teacherManagement], [amount, -amount]);

      const user = await teacherManagement.getUser(0);
      expect(user.totalPaid).to.equal(amount);
    });

    it("Should revert if amount exceeds agreed salary", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const agreedSalary = hre.ethers.parseEther("1");
      const amount = hre.ethers.parseEther("2");

      await teacherManagement.connect(user1).registerUser("John Doe", 0, agreedSalary);
      await expect(
        teacherManagement.connect(user1).disburseSalary(0, amount, { value: amount })
      )
        .to.be.revertedWithCustomError(teacherManagement, "SalaryExceedsAgreedAmount")
        .withArgs(amount, agreedSalary);
    });

    it("Should revert if insufficient balance sent", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const agreedSalary = hre.ethers.parseEther("1");
      const amount = hre.ethers.parseEther("0.5");

      await teacherManagement.connect(user1).registerUser("John Doe", 0, agreedSalary);
      await expect(
        teacherManagement.connect(user1).disburseSalary(0, amount, { value: hre.ethers.parseEther("0.2") })
      )
        .to.be.revertedWithCustomError(teacherManagement, "InsufficientBalance")
        .withArgs(amount, hre.ethers.parseEther("0.2"));
    });

    it("Should revert if user is not employed", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const agreedSalary = hre.ethers.parseEther("1");
      const amount = hre.ethers.parseEther("0.5");

      await teacherManagement.connect(user1).registerUser("John Doe", 0, agreedSalary);
      await teacherManagement.connect(user1).terminateUser(0);
      await expect(
        teacherManagement.connect(user1).disburseSalary(0, amount, { value: amount })
      ).to.be.revertedWithCustomError(teacherManagement, "UserNotEmployed").withArgs(0);
    });
  });

  describe("User Queries", function () {
    it("Should return correct user by ID", async function () {
      const { teacherManagement, user1 } = await loadFixture(deployTeacherManagementFixture);
      const name = "John Doe";
      const userType = 0;
      const agreedSalary = hre.ethers.parseEther("1");

      await teacherManagement.connect(user1).registerUser(name, userType, agreedSalary);
      const user = await teacherManagement.getUser(0);
      expect(user.id).to.equal(0);
      expect(user.name).to.equal(name);
      expect(user.userType).to.equal(userType);
      expect(user.agreedSalary).to.equal(agreedSalary);
    });

    it("Should return users by type", async function () {
      const { teacherManagement, user1, user2 } = await loadFixture(deployTeacherManagementFixture);
      await teacherManagement.connect(user1).registerUser("John Doe", 0, hre.ethers.parseEther("1"));
      await teacherManagement.connect(user2).registerUser("Jane Doe", 0, hre.ethers.parseEther("1"));

      const mentorIds = await teacherManagement.getUsersByType(0);
      expect(mentorIds.map(id => id.toString())).to.have.members([0, 1]);
    });

    it("Should return all users", async function () {
      const { teacherManagement, user1, user2 } = await loadFixture(deployTeacherManagementFixture);
      await teacherManagement.connect(user1).registerUser("John Doe", 0, hre.ethers.parseEther("1"));
      await teacherManagement.connect(user2).registerUser("Jane Doe", 1, hre.ethers.parseEther("1"));

      const allUsers = await teacherManagement.getAllUsers();
      expect(allUsers.map(id => id.toString())).to.have.members([0, 1]);
    });
  });
});