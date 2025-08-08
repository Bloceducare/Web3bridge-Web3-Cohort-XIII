import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("EmployeeManagement", function () {
  async function deployEmployeeManagement() {
    const salary = 100000;

    const [admin, otherAccount] = await hre.ethers.getSigners();

    const EmployeeManagement = await hre.ethers.getContractFactory(
      "EmployeeManagement"
    );

    const employeeManagement = await EmployeeManagement.deploy();

    return { employeeManagement, admin, otherAccount, salary };
  }

  describe("Register Employee", function () {
    it("This is to register an employee", async function () {
      const { employeeManagement, otherAccount } = await loadFixture(
        deployEmployeeManagement
      );

      const employeeName = "David James";
      const employeeRole = 2;

      await employeeManagement.register_employee(
        employeeName,
        otherAccount.address,
        employeeRole
      );

      const employee = await employeeManagement.get_all_employee();

      const get_employee_details = employee[0];

      expect(get_employee_details.name).to.equal(employeeName);
    });
  });

  describe("Update Salary", function () {
    it("This is to update employee salary", async function () {
      const { employeeManagement, otherAccount } = await loadFixture(
        deployEmployeeManagement
      );

      await employeeManagement.update_salary(otherAccount.address);

      const employee = await employeeManagement.get_employee(
        otherAccount.address
      );

      expect(employee.salary).to.equal(200000);
    });
  });

  describe("View Employee", function () {
    it("This is to see an employee", async function () {
      const { employeeManagement, otherAccount } = await loadFixture(
        deployEmployeeManagement
      );

      const employee = await employeeManagement.get_employee(
        otherAccount.address
      );

      expect(employee).to.equal(employee);
    });
  });

  describe("View All Employee", function () {
    it("This is to see all employee", async function () {
      const { employeeManagement, otherAccount } = await loadFixture(
        deployEmployeeManagement
      );

      // Register an employee first to ensure the list is not empty
      const employeeName = "David James";
      const employeeRole = 2;
      await employeeManagement.register_employee(
        employeeName,
        otherAccount.address,
        employeeRole
      );

      const employees = await employeeManagement.get_all_employee();

      expect(employees.length).to.be.greaterThan(0);
      expect(employees[0].name).to.equal(employeeName);
      expect(employees[0].employeeAddress).to.equal(otherAccount.address);
      expect(employees[0].role).to.equal(employeeRole);
    });
  });

  describe("Pay Salary", function () {
    it("This is to pay employee salary", async function () {
      const { employeeManagement, otherAccount, salary } = await loadFixture(
        deployEmployeeManagement
      );

      // Register the employee before paying salary

      const employeeNewStatus = 0;

      const balance = await employeeManagement.get_balance(
        otherAccount.address
      );

      await employeeManagement.pay_salary(otherAccount.address, salary);

      const employee = await employeeManagement.get_employee(
        otherAccount.address
      );

      const new_balance = await employeeManagement.get_balance(
        otherAccount.address
      );

      (await employee.status) == BigInt(employeeNewStatus);

      expect(new_balance).to.equal(balance + BigInt(salary));
    });
  });
});
