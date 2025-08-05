import { ethers } from "hardhat";
import { EMS } from "../typechain-types";
import { expect } from "chai";

enum Status {
  EMPLOYED,
  UNEMPLOYED,
  PROBATION,
}

enum Role {
  MENTOR,
  JANITOR,
  SECURITY,
  MANAGER,
}

describe("EMS", async () => {
  let EMSFactory;
  let EMSInstance: EMS;

  beforeEach("deploy contract", async () => {
    EMSFactory = await ethers.getContractFactory("EMS");
    EMSInstance = await EMSFactory.deploy();

    await EMSInstance.waitForDeployment();
  });

  describe("Employee Registration", async () => {
    it("should successfully register an employee", async () => {
      const [_, john] = await ethers.getSigners();

      const _salary = 1e9; //1 Gwei
      const _name = "John";
      const _telephone = "09126878959";
      const _houseAddress = "No 20 FatadeRoad";
      const _role = Role.JANITOR;

      await EMSInstance.registerEmployee(
        john.address,
        _salary,
        _name,
        _telephone,
        _houseAddress,
        _role
      );

      // get the newly registered employee
      const {
        house_address: houseAddress_,
        employee_address: employeeAddress_,
        salary: salary_,
        name: name_,
        telephone: telephone_,
        // status: status_,
        role: role_,
        exists,
      } = await EMSInstance.employees(john.address);

      expect(houseAddress_).to.equal(_houseAddress);
      expect(name_).to.equal(_name);
      expect(telephone_).to.equal(_telephone);
      expect(employeeAddress_).to.equal(john.address);
      expect(exists).to.equal(true);
      expect(role_).to.equal(_role);
      expect(salary_).to.equal(_salary);
    });

    it("should ensure a newly registered user's status is EMPLOYED", async () => {
      const [_, john] = await ethers.getSigners();

      const _salary = 1e9; //1 Gwei
      const _name = "John";
      const _telephone = "09126878959";
      const _houseAddress = "No 20 FatadeRoad";
      const _role = Role.JANITOR;

      await EMSInstance.registerEmployee(
        john.address,
        _salary,
        _name,
        _telephone,
        _houseAddress,
        _role
      );

      // get the newly registered employee
      const { status: status_ } = await EMSInstance.employees(john.address);
      expect(status_).to.equal(Status.EMPLOYED);
    });
  });

  describe("Employee Payment", async () => {
    it("should successfully pay employee", async () => {
      const [owner, john] = await ethers.getSigners();

      // give the contract some eth to use as payment
      owner.sendTransaction({
        to: await EMSInstance.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      // user info
      const _salary = 1e9; //1 Gwei
      const _name = "John";
      const _telephone = "09126878959";
      const _houseAddress = "No 20 FatadeRoad";
      const _role = Role.JANITOR;

      // register employee
      await EMSInstance.registerEmployee(
        john.address,
        _salary,
        _name,
        _telephone,
        _houseAddress,
        _role
      );

      // get employee's balance before payment
      const johnsInitialBalance = await ethers.provider.getBalance(
        john.address
      );

      // pay john
      await EMSInstance.payEmployee(john.address);

      // get employee's balance after payment
      const johnsFinalBalance = await ethers.provider.getBalance(john.address);

      expect(johnsFinalBalance - johnsInitialBalance).to.equal(_salary);
    });
  });
});
