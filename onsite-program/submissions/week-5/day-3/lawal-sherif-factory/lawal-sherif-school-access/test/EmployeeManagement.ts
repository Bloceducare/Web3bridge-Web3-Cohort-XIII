import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("EmployeeManagement", function () {
  async function deployEmployeeManagement() {
    const EmployeeManagement = await hre.ethers.getContractFactory(
      "EmployeeManagement"
    );
    const employeeManagement = await EmployeeManagement.deploy();

    return { employeeManagement };
  }
  describe("Employee registration and payment", function () {
    it("Should register and pay an employee correctly", async function () {
      const { employeeManagement } = await loadFixture(
        deployEmployeeManagement
      );
      const [owner, employeeSigner] = await hre.ethers.getSigners();

      const name = "Bayo";

      const employeeAddress = employeeSigner.address;

      const salary = hre.ethers.parseEther("2");

      const status = 0;

      const role = 0;

      await employeeManagement.create_employee(
        name,
        employeeAddress,
        salary,
        status,
        role
      );
      const employee_length = await employeeManagement.get_all_employees();

      const get_employee_details = employee_length[0];

      expect(get_employee_details.name).to.equal(name);
      expect(get_employee_details.employeeAddress).to.equal(employeeAddress);
      expect(get_employee_details.salary).to.equal(salary);
      expect(get_employee_details.status).to.equal(status);
      expect(get_employee_details.role).to.equal(role);
    });

    // should pay employee

    it("Should pay employee accurate salary", async function () {
      const { employeeManagement } = await loadFixture(
        deployEmployeeManagement
      );
      const [owner, employeeSigner] = await hre.ethers.getSigners();

      const name = "Bayo";

      const employeeAddress = employeeSigner.address;

      const salary = hre.ethers.parseEther("2");

      const status = 0;

      const role = 0;

      await employeeManagement.create_employee(
        name,
        employeeAddress,
        salary,
        status,
        role
      );

      // Fund the contract
      await owner.sendTransaction({
        to: employeeManagement.target,
        value: hre.ethers.parseEther("2"),
      });

      const balanceBefore = await hre.ethers.provider.getBalance(
        employeeAddress
      );

      // Now pay the employee (use the same salary amount that was registered)
      await employeeManagement
        .connect(owner)
        .pay_employee(employeeAddress, salary);

      const balanceAfter = await hre.ethers.provider.getBalance(
        employeeAddress
      );

      expect(balanceAfter - balanceBefore).to.equal(salary);
    });

    // details for all employee array

    it("Should get employee detailts", async function () {
      const { employeeManagement } = await loadFixture(
        deployEmployeeManagement
      );

      const [owner, employeeSigner] = await hre.ethers.getSigners();

      const name = "Bayo";

      const employeeAddress = employeeSigner.address;

      const salary = hre.ethers.parseEther("2");

      const status = 0;

      const role = 0;

      await employeeManagement.create_employee(
        name,
        employeeAddress,
        salary,
        status,
        role
      );

      const getEmployee = await employeeManagement.get_all_employees();
      expect(getEmployee).to.be.an("array");
      expect(getEmployee).to.lengthOf(1);
    });

    // details for all employee array

    it("Should get all details for an employee", async function () {
      const { employeeManagement } = await loadFixture(
        deployEmployeeManagement
      );

      const [owner, employeeSigner] = await hre.ethers.getSigners();

      const name = "Bayo";

      const employeeAddress = employeeSigner.address;

      const salary = hre.ethers.parseEther("2");

      const status = 0;

      const role = 0;

      await employeeManagement.create_employee(
        name,
        employeeAddress,
        salary,
        status,
        role
      );

      const getAnEmployee = await employeeManagement.get_emplooyee(
        employeeAddress
      );
      expect(getAnEmployee.employeeAddress).to.equal(employeeAddress);
      expect(getAnEmployee.name).to.equal(name);
      expect(getAnEmployee.salary).to.equal(salary);
      expect(getAnEmployee.role).to.equal(role);
      expect(getAnEmployee.status).to.equal(status);
    });
  });
});
