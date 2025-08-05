import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AccessControl Deployment", function () {
  async function deployAccessControl() {
    const AccessControl = await hre.ethers.getContractFactory("AccessControl");
    const accessControl = await AccessControl.deploy();
    return { accessControl };
  }

  describe("Add Employee", function () {
    it("Should add an employee and store details correctly", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [owner, emp1] = await hre.ethers.getSigners();

      const name = "Alice";
      const role = 0; // MediaTeam
      const employed = true;

      await accessControl.addEmployee(emp1.address, name, role, employed);

      const empData = await accessControl.getEmployee(emp1.address);

      expect(empData[0]).to.equal(name);
      expect(empData[1]).to.equal(role);
      expect(empData[2]).to.equal(employed);
    });

    it("Should revert if employee already exists", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [owner, emp1] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "Alice", 0, true);

      await expect(
        accessControl.addEmployee(emp1.address, "Alice", 0, true)
      ).to.be.revertedWith("Employee already exists");
    });
  });

  describe("Update Employee", function () {
    it("Should update existing employee info", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [owner, emp1] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "Alice", 0, true);
      await accessControl.updateEmployee(emp1.address, "AliceUpdated", 1, false);

      const updated = await accessControl.getEmployee(emp1.address);

      expect(updated[0]).to.equal("AliceUpdated");
      expect(updated[1]).to.equal(1);
      expect(updated[2]).to.equal(false);
    });

    it("Should revert if employee does not exist", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [_, emp2] = await hre.ethers.getSigners();

      await expect(
        accessControl.updateEmployee(emp2.address, "Bob", 2, true)
      ).to.be.revertedWith("Employee does not exist");
    });
  });

  describe("Garage Access", function () {
    it("Should allow garage access for approved roles", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [_, emp1] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "MentorUser", 1, true); // Mentors

      const access = await accessControl.canAccessGarage(emp1.address);
      expect(access).to.equal(true);
    });

    it("Should deny garage access for disallowed roles", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [_, emp1] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "TechUser", 4, true); // TechnicianSupervisor

      const access = await accessControl.canAccessGarage(emp1.address);
      expect(access).to.equal(false);
    });

    it("Should deny garage access if not employed", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [_, emp1] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "UnemployedUser", 1, false); // Mentors

      const access = await accessControl.canAccessGarage(emp1.address);
      expect(access).to.equal(false);
    });
  });

  describe("Employee List", function () {
    it("Should return all employee addresses", async function () {
      const { accessControl } = await loadFixture(deployAccessControl);
      const [_, emp1, emp2] = await hre.ethers.getSigners();

      await accessControl.addEmployee(emp1.address, "Alice", 0, true);
      await accessControl.addEmployee(emp2.address, "Bob", 1, true);

      const list = await accessControl.getAllEmployees();

      expect(list.length).to.equal(2);
      expect(list[0]).to.equal(emp1.address);
      expect(list[1]).to.equal(emp2.address);
    });
  });
});
