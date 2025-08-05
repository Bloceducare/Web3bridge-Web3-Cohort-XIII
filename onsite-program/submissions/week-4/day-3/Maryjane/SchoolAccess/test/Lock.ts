import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SchoolAccess", function () {
  async function deploy() {
    const SchoolAccess = await ethers.getContractFactory("SchoolAccess");
    const schoolAccess = await SchoolAccess.deploy();
    await schoolAccess.waitForDeployment();
    return { schoolAccess };
  }

  const employeeWallet = "0x1852ebfaba9ca73bd19760542b5ab7278f495d0e";
  const normalizedWallet = ethers.getAddress(employeeWallet);

  describe("addEmployee", function () {
    it("Should add a new employee", async function () {
      const { schoolAccess } = await loadFixture(deploy);
      await schoolAccess.addEmployee(employeeWallet, "Loveth", 1, true);
      const employee = await schoolAccess.employees(employeeWallet);
      expect(employee.name).to.equal("Loveth");
      expect(employee.role).to.equal(1n);
      expect(employee.isEmployed).to.equal(true);
      expect(employee.wallet).to.equal(normalizedWallet);
    });
  });

  describe("updateEmployee", function () {
    it("Should update existing employee", async function () {
      const { schoolAccess } = await loadFixture(deploy);
      await schoolAccess.addEmployee(employeeWallet, "Loveth", 1, true);
      await schoolAccess.updateEmployee(employeeWallet, "Jane Adebayo", 2, false);
      const employee = await schoolAccess.employees(employeeWallet);
      expect(employee.name).to.equal("Jane Adebayo");
      expect(employee.role).to.equal(2n);
      expect(employee.isEmployed).to.equal(false);
      expect(employee.wallet).to.equal(normalizedWallet);
    });
  });

  describe("getAllEmployees", function () {
    it("Should return all employees in array", async function () {
      const { schoolAccess } = await loadFixture(deploy);
      await schoolAccess.addEmployee(employeeWallet, "Jane Adebayo", 2, false);
      const allEmployees = await schoolAccess.getAllEmployees();
      expect(allEmployees.length).to.equal(1);
      expect(allEmployees[0].name).to.equal("Jane Adebayo");
      expect(allEmployees[0].role).to.equal(2n);
      expect(allEmployees[0].isEmployed).to.equal(false);
      expect(allEmployees[0].wallet).to.equal(normalizedWallet);
    });
  });
});