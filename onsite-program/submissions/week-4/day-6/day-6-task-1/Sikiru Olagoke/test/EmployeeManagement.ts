import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("EmployeeManagment", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEmployeeManagement() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount1, otherAccount2] = await hre.ethers.getSigners();

    const EmployeeManagement = await hre.ethers.getContractFactory(
      "EmployeeManagement"
    );

    const employeeManagement = await EmployeeManagement.deploy();

    return { employeeManagement, owner, otherAccount1, otherAccount2 };
  }

  describe("Create Employee", function () {
    it("Should create employee", async function () {
      const { owner, employeeManagement, otherAccount1 } = await loadFixture(
        deployEmployeeManagement
      );

      const name = "Samsom";
      const address = otherAccount1.address;
      const salary = 200000;
      const status = 2;
      const role = 0;

      await employeeManagement.create_employee(
        name,
        address,
        salary,
        status,
        role
      );

      const employee = await employeeManagement.get_all_employees();

      expect(employee.length).to.be.gt(0);
    });

    it("Should get one employee", async () => {
      const { owner, employeeManagement, otherAccount1 } = await loadFixture(
        deployEmployeeManagement
      );

      const name = "Samsom";
      const address = otherAccount1.address;
      const salary = 200000;
      const status = 2;
      const role = 0;

      await employeeManagement.create_employee(
        name,
        address,
        salary,
        status,
        role
      );

      const employee = await employeeManagement.get_emplooyee(address);

      expect(employee.user_address).to.equal(otherAccount1.address);
    });

    it("Should pay employee", async () => {
      const { owner, employeeManagement, otherAccount1 } = await loadFixture(
        deployEmployeeManagement
      );

      const name = "Samsom";
      const address = otherAccount1.address;
      const salary = 200000;
      const status = 2;
      const role = 0;

      await employeeManagement.create_employee(
        name,
        address,
        salary,
        status,
        role
      );

      const _amount = 200000;

      const employee = await employeeManagement.get_emplooyee(address);

      expect(employee.salary).to.equal(_amount);
    });
  });
});
