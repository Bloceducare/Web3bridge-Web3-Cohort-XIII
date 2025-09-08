import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Factory Test", function () {
  async function deployEmployeeFactory() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const EmployeeManagementFactory = await hre.ethers.getContractFactory(
      "EmployeeFactory"
    );

    const employeeManagementFactory = await EmployeeManagementFactory.deploy();

    return { employeeManagementFactory, owner, otherAccount };
  }

  describe("Employee Factory Length", function () {
    it("This create factory", async function () {
      const { employeeManagementFactory } = await loadFixture(
        deployEmployeeFactory
      );

      const factory = await employeeManagementFactory.FactoryAddress.length;

      expect(factory).to.equals(0);
    });
  });

  describe("Factory Creation", function () {
    it("This create a new factory", async function () {
      const { employeeManagementFactory } = await loadFixture(
        deployEmployeeFactory
      );

      const createFactory =
        await employeeManagementFactory.register_factory_employee();

      expect(createFactory).to.not.equals(0);
    });
  });

  describe("Get factory address", function () {
    it("This gets the factory length", async function () {
      const { employeeManagementFactory, otherAccount } = await loadFixture(
        deployEmployeeFactory
      );

      await employeeManagementFactory.register_factory_employee();

      //   const contractAddress = employeeManagementFactory.FactoryAddress;

      const factory = await employeeManagementFactory.FactoryAddress.length;

      expect(factory).to.equals(0);
    });
  });
});
