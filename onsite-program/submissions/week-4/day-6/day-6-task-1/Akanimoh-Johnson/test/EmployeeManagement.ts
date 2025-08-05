import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EmployeeManagement, EmployeeManagement__factory } from "../typechain-types";

describe("EmployeeManagement Contract", function () {
  let EmployeeManagement: EmployeeManagement__factory;
  let employeeManagement: EmployeeManagement;
  let owner: SignerWithAddress;
  let employee: SignerWithAddress;
  const name = "Akanimoh Johnson";
  const role = 0; 
  const salaryInEther = 1;
  const salaryInWei = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, employee] = await ethers.getSigners();
    EmployeeManagement = await ethers.getContractFactory("EmployeeManagement");
    employeeManagement = await EmployeeManagement.deploy();
    await employeeManagement.waitForDeployment();
  });

  describe("addEmployee", function () {
    it(" add employee and emit EmployeeAdded", async function () {
      await expect(employeeManagement.addEmployee(employee.address, name, role, salaryInEther))
        .to.emit(employeeManagement, "EmployeeAdded")
        .withArgs(employee.address, name, role, salaryInWei);
      const emp = await employeeManagement.getEmployeeDetails(employee.address);
      expect(emp.name).to.equal(name);
      expect(emp.role).to.equal(role);
      expect(emp.status).to.equal(0); // ACTIVE
      expect(emp.salary).to.equal(salaryInWei);
    });

    it(" revert if employee already exists", async function () {
      await employeeManagement.addEmployee(employee.address, name, role, salaryInEther);
      await expect(employeeManagement.addEmployee(employee.address, name, role, salaryInEther))
        .to.be.revertedWithCustomError(employeeManagement, "EmployeeAlreadyExists");
    });
  });

  describe("disburseSalary", function () {
    it(" disburse salary and emit SalaryDisbursed", async function () {
      await employeeManagement.addEmployee(employee.address, name, role, salaryInEther);
      await employeeManagement.fundContract({ value: salaryInWei });
      await expect(employeeManagement.disburseSalary(employee.address, { value: salaryInWei }))
        .to.emit(employeeManagement, "SalaryDisbursed")
        .withArgs(employee.address, salaryInWei);
      const emp = await employeeManagement.getEmployeeDetails(employee.address);
      expect(emp.totalPaid).to.equal(salaryInWei);
    });

    it(" revert if employee not found", async function () {
      await expect(employeeManagement.disburseSalary(employee.address, { value: salaryInWei }))
        .to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
    });
  });

  describe("canAccessGarage", function () {
    it(" return true for active employee", async function () {
      await employeeManagement.addEmployee(employee.address, name, role, salaryInEther);
      expect(await employeeManagement.canAccessGarage(employee.address)).to.be.true;
    });
  });

  describe("getEmployeeDetails", function () {
    it(" return employee details", async function () {
      await employeeManagement.addEmployee(employee.address, name, role, salaryInEther);
      const emp = await employeeManagement.getEmployeeDetails(employee.address);
      expect(emp.name).to.equal(name);
      expect(emp.salary).to.equal(salaryInWei);
    });

    it(" revert if employee not found", async function () {
      await expect(employeeManagement.getEmployeeDetails(employee.address))
        .to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
    });
  });

  describe("fundContract and withdrawExcessEther", function () {
    it(" fund contract and withdraw excess", async function () {
      await employeeManagement.fundContract({ value: salaryInWei });
      expect(await employeeManagement.getContractBalance()).to.equal(salaryInWei);
      await expect(employeeManagement.withdrawExcessEther(salaryInEther))
        .to.emit(employeeManagement, "EtherWithdrawn")
        .withArgs(owner.address, salaryInWei);
      expect(await employeeManagement.getContractBalance()).to.equal(0);
    });

    it(" revert on withdraw with insufficient funds", async function () {
      await expect(employeeManagement.withdrawExcessEther(salaryInEther))
        .to.be.revertedWithCustomError(employeeManagement, "InsufficientFunds");
    });
  });
});