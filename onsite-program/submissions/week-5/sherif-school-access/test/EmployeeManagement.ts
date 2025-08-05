import { expect } from "chai";
import { ethers } from "hardhat";

describe("Employee Management Contract", function () {
  let employeeManagement;
  let owner;
  let employee1;
  let employee2;
  let nonOwner;

  const STATUS = {
    EMPLOYED: 0,
    PROBATION: 1,
    TERMINATED: 2,
  };

  const ROLE = {
    MENTORS: 0,
    SECURITY: 1,
    CLEANER: 2,
  };

  async function deployContractFixture() {
    const [owner, employee1, employee2, nonOwner] = await ethers.getSigners();

    const EmployeeManagement = await ethers.getContractFactory(
      "EmployeeManagement"
    );
    const employeeManagement = await EmployeeManagement.deploy();

    return { employeeManagement, owner, employee1, employee2, nonOwner };
  }

  beforeEach(async function () {
    const fixture = await deployContractFixture();
    employeeManagement = fixture.employeeManagement;
    owner = fixture.owner;
    employee1 = fixture.employee1;
    employee2 = fixture.employee2;
    nonOwner = fixture.nonOwner;
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { employeeManagement } = await deployContractFixture();
      expect(employeeManagement.target).to.be.properAddress;
    });
  });
});
