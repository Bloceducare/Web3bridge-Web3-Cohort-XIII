import { expect } from "chai";
import { ethers } from "hardhat";
import { EmployeeManagement } from "../typechain-types";

describe("EmployeeManagement", function () {
  let contract: EmployeeManagement;
  let owner: any;
  let employee1: any;
  let employee2: any;
  let nonEmployee: any;

  before(async () => {
    [owner, employee1, employee2, nonEmployee] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const Factory = await ethers.getContractFactory("EmployeeManagement");
    contract = await Factory.deploy();
    await contract.initialize();
  });

  describe("Initialization", () => {
    it("Should set owner during initialization", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should prevent re-initialization", async () => {
      await expect(contract.initialize()).to.be.revertedWithCustomError(
        contract,
        "AlreadyInitialized"
      );
    });
  });

  describe("Employee Registration", () => {
    it("Should register a new employee", async () => {
      await contract.registerEmployee(
        employee1.address,
        ethers.parseEther("1"),
        0, // Mentor
        0  // Employed
      );
      const emp = await contract.employees(employee1.address);
      expect(emp.exists).to.be.true;
    });

    it("Should reject zero address registration", async () => {
      await expect(
        contract.registerEmployee(
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          0,
          0
        )
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("Should prevent duplicate registration", async () => {
      await contract.registerEmployee(employee1.address, 1000, 0, 0);
      await expect(
        contract.registerEmployee(employee1.address, 1000, 0, 0)
      ).to.be.revertedWithCustomError(contract, "AlreadyRegistered");
    });
  });

  describe("Salary Disbursement", () => {
    const salary = ethers.parseEther("1");

    beforeEach(async () => {
      await contract.registerEmployee(employee1.address, salary, 0, 0);
      await contract.depositFunds({ value: salary });
    });

    it("Should disburse salary successfully", async () => {
      const initialBalance = await ethers.provider.getBalance(employee1.address);
      await contract.disburseSalary(employee1.address, { value: salary });
      const newBalance = await ethers.provider.getBalance(employee1.address);
      expect(newBalance - initialBalance).to.equal(salary);
    });

    it("Should reject disbursement to non-employee", async () => {
      await expect(
        contract.disburseSalary(nonEmployee.address, { value: salary })
      ).to.be.revertedWithCustomError(contract, "EmployeeNotRegistered");
    });

    it("Should reject disbursement to unemployed", async () => {
      await contract.updateEmployeeStatus(employee1.address, 1); // Unemployed
      await expect(
        contract.disburseSalary(employee1.address, { value: salary })
      ).to.be.revertedWithCustomError(contract, "EmployeeNotEmployed");
    });

    it("Should reject excessive salary payment", async () => {
      await expect(
        contract.disburseSalary(employee1.address, { value: salary + 1n })
      ).to.be.revertedWithCustomError(contract, "SalaryExceedsAgreedAmount");
    });
  });

  describe("Employee Management", () => {
    it("Should update employee status", async () => {
      await contract.registerEmployee(employee1.address, 1000, 0, 0);
      await contract.updateEmployeeStatus(employee1.address, 1); // Unemployed
      const emp = await contract.employees(employee1.address);
      expect(emp.status).to.equal(1);
    });

    it("Should return all employee addresses", async () => {
      await contract.registerEmployee(employee1.address, 1000, 0, 0);
      await contract.registerEmployee(employee2.address, 1000, 1, 0);
      const addresses = await contract.getAllEmployees();
      expect(addresses).to.deep.equal([employee1.address, employee2.address]);
    });
  });

  describe("Fund Management", () => {
    it("Should deposit funds", async () => {
      const amount = ethers.parseEther("1");
      await contract.depositFunds({ value: amount });
      expect(await contract.getContractBalance()).to.equal(amount);
    });

    it("Should detect insufficient funds", async () => {
      await contract.registerEmployee(employee1.address, 1000, 0, 0);
      await expect(
        contract.disburseSalary(employee1.address, { value: 1000 })
      ).to.be.revertedWithCustomError(contract, "InsufficientContractBalance");
    });
  });
});