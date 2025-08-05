import { expect } from "chai";
import hre from "hardhat";
// const { ethers } = require("hardhat");

describe("EmployeeManagementSystem", function () {
  let ems, owner, addr1, addr2, addr3;
  const salary = hre.ethers.parseEther("1");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await hre.ethers.getSigners();
    const EMS = await hre.ethers.getContractFactory("EmployeeManagementSystem");
    ems = await EMS.deploy();
    await ems.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ems.owner()).to.equal(owner.address);
    });
  });

  describe("Employee Registration", function () {
    it("Should register an employee", async function () {
      await expect(ems.registerEmployee(addr1.address, 0, salary))
        .to.emit(ems, "EmployeeRegistered")
        .withArgs(addr1.address, 0, salary);
      const details = await ems.getEmployeeDetails(addr1.address);
      expect(details[0]).to.equal(0); // EmployeeType.Mentor
      expect(details[1]).to.equal(salary);
      expect(details[2]).to.equal(0); // EmploymentStatus.Active
      expect(details[3]).to.equal(0n); // amountPaid
    });

    it("Should not allow non-owner to register", async function () {
      await expect(
        ems.connect(addr1).registerEmployee(addr2.address, 1, salary)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not register with invalid address", async function () {
      await expect(
        ems.registerEmployee(ethers.constants.AddressZero, 0, salary)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should not register with zero salary", async function () {
      await expect(
        ems.registerEmployee(addr1.address, 0, 0)
      ).to.be.revertedWith("Salary must be greater than zero");
    });

    it("Should not register with invalid employee type", async function () {
      await expect(
        ems.registerEmployee(addr1.address, 3, salary)
      ).to.be.revertedWith("Invalid employee type");
    });

    it("Should not register the same employee twice", async function () {
      await ems.registerEmployee(addr1.address, 0, salary);
      await expect(
        ems.registerEmployee(addr1.address, 0, salary)
      ).to.be.revertedWith("Employee already registered");
    });
  });

  describe("Payout", function () {
    beforeEach(async function () {
      await ems.registerEmployee(addr1.address, 0, salary);
    });

    it("Should payout to active employee", async function () {
      await expect(
        ems.payout(addr1.address, { value: hre.ethers.parseEther("0.5") })
      )
        .to.emit(ems, "EmployeePayout")
        .withArgs(addr1.address, hre.ethers.parseEther("0.5"));
      const details = await ems.getEmployeeDetails(addr1.address);
      expect(details[3]).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("Should not payout more than salary", async function () {
      await ems.payout(addr1.address, { value: hre.ethers.parseEther("0.7") });
      await expect(
        ems.payout(addr1.address, { value: hre.ethers.parseEther("0.4") })
      ).to.be.revertedWith("Amount exceeds agreed salary");
    });

    it("Should not payout if already fully paid", async function () {
      await ems.payout(addr1.address, { value: salary });
      await expect(
        ems.payout(addr1.address, { value: 1 })
      ).to.be.revertedWith("Employee has already been fully paid");
    });

    it("Should not payout to inactive employee", async function () {
      await ems.setEmploymentStatus(addr1.address, 1); // Suspended
      await expect(
        ems.payout(addr1.address, { value: 1 })
      ).to.be.revertedWith("Employee is not currently active");
    });

    it("Should not payout with zero value", async function () {
      await expect(
        ems.payout(addr1.address, { value: 0 })
      ).to.be.revertedWith("No Ether sent");
    });

    it("Should not allow non-owner to payout", async function () {
      await expect(
        ems.connect(addr2).payout(addr1.address, { value: 1 })
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Employment Status", function () {
    beforeEach(async function () {
      await ems.registerEmployee(addr1.address, 0, salary);
    });

    it("Should change employment status", async function () {
      await expect(ems.setEmploymentStatus(addr1.address, 1))
        .to.emit(ems, "EmployeeStatusChanged")
        .withArgs(addr1.address, 1);
      const details = await ems.getEmployeeDetails(addr1.address);
      expect(details[2]).to.equal(1); // Suspended
    });

    it("Should not allow invalid status", async function () {
      await expect(
        ems.setEmploymentStatus(addr1.address, 4)
      ).to.be.revertedWith("Invalid status");
    });

    it("Should not change status of terminated employee", async function () {
      await ems.setEmploymentStatus(addr1.address, 2); // Terminated
      await expect(
        ems.setEmploymentStatus(addr1.address, 1)
      ).to.be.revertedWith("Cannot change status of terminated employee");
    });

    it("Should not allow non-owner to change status", async function () {
      await expect(
        ems.connect(addr2).setEmploymentStatus(addr1.address, 1)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await ems.registerEmployee(addr1.address, 0, salary);
      await ems.registerEmployee(addr2.address, 1, salary);
    });

    it("Should return all employees", async function () {
      const employees = await ems.getAllEmployees();
      expect(employees).to.include(addr1.address);
      expect(employees).to.include(addr2.address);
    });

    it("Should return correct employment status", async function () {
      expect(await ems.isEmployed(addr1.address)).to.equal(true);
      await ems.setEmploymentStatus(addr1.address, 1); // Suspended
      expect(await ems.isEmployed(addr1.address)).to.equal(false);
    });

    it("Should return correct employee details", async function () {
      const details = await ems.getEmployeeDetails(addr1.address);
      expect(details[0]).to.equal(0); // Mentor
      expect(details[1]).to.equal(salary);
      expect(details[2]).to.equal(0); // Active
      expect(details[3]).to.equal(0); // amountPaid
    });
  });
});
