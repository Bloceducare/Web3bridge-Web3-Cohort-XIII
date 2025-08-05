import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";

describe("Management Contract", function () {
  let Management: any; 
  let management: any; 
  let owner: any; 
  let addr1: any;
  let addr2: any;
  const EMPLOYEE_NAME = "John Doe";
  const SALARY = ethers.parseEther("1");
  const ROLE = 0; 

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Management = await ethers.getContractFactory("Management");
    management = await Management.deploy();
    await management.waitForDeployment();
  });

  describe("createEmployee", function () {
    it("should create a new employee", async function () {
      await management.createEmployee(addr1.address, EMPLOYEE_NAME, SALARY, ROLE);
      
      const employee = await management.employees(addr1.address);
      expect(employee.name).to.equal(EMPLOYEE_NAME);
      expect(employee.salary).to.equal(SALARY);
      expect(employee.status).to.equal(0);
      expect(employee.exists).to.be.true;
      expect(employee.employeeAddress).to.equal(addr1.address);
      expect(employee.role).to.equal(ROLE);
    });

    it("should revert if employee already exists", async function () {
      await management.createEmployee(addr1.address, EMPLOYEE_NAME, SALARY, ROLE);
      await expect(
        management.createEmployee(addr1.address, EMPLOYEE_NAME, SALARY, ROLE)
      ).to.be.revertedWith("Employee already exists");
    });
  });

  describe("transfer", function () {
    beforeEach(async function () {
      await management.createEmployee(addr1.address, EMPLOYEE_NAME, SALARY, ROLE);
      // Fund contract and owner's balance
      await management.fundOwner({ value: ethers.parseEther("10") });
    });

    it("should transfer salary successfully", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await management.transfer(addr1.address, SALARY);
      
      const employee = await management.employees(addr1.address);
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      
      expect(employee.exists).to.be.true;
      expect(finalBalance).to.be.above(initialBalance);
    });

    it("should revert if not called by owner", async function () {
      await expect(
        management.connect(addr2).transfer(addr1.address, SALARY)
      ).to.be.reverted;
    });

    it("should revert for invalid recipient (zero address)", async function () {
      await expect(
        management.transfer(ethers.ZeroAddress, SALARY)
      ).to.be.revertedWithCustomError(management, "InvalidRecipient");
    });

    it("should revert if employee doesn't exist", async function () {
      await expect(
        management.transfer(addr2.address, SALARY)
      ).to.be.revertedWith("Recipient is not an employee");
    });

    it("should revert if salary doesn't match", async function () {
      await expect(
        management.transfer(addr1.address, SALARY + BigInt(1))
      ).to.be.reverted;
    });
  });

  describe("getContractBalance", function () {
    it("should return correct contract balance", async function () {
      const depositAmount = ethers.parseEther("5");
      await owner.sendTransaction({
        to: management.target,
        value: depositAmount,
      });
      
      expect(await management.getContractBalance()).to.equal(depositAmount);
    });
  });
});