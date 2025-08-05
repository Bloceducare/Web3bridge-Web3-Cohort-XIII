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
      } = await EMSInstance.getEmployee(john.address);

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
      const { status: status_ } = await EMSInstance.getEmployee(john.address);
      expect(status_).to.equal(Status.EMPLOYED);
    });

    it("should revert if employee does not exist", async () => {
      const [_, john, nobody] = await ethers.getSigners();

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
      await expect(
        EMSInstance.getEmployee(nobody.address)
      ).to.revertedWithCustomError(EMSInstance, "EMS__NotFoundError");
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

    it("should revert when there's insufficient funds", async () => {
      const [owner, john] = await ethers.getSigners();

      // give the contract some eth to use as payment
      owner.sendTransaction({
        to: await EMSInstance.getAddress(),
        value: ethers.parseEther("0.0000000001"),
      });

      // employee info
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
      // pay john
      await expect(
        EMSInstance.payEmployee(john.address)
      ).to.revertedWithCustomError(EMSInstance, "EMS__InsufficientFunds");
    });

    it("should revert if employee doesn't exist", async () => {
      const [owner, john, nobody] = await ethers.getSigners();

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
      await expect(
        EMSInstance.payEmployee(nobody.address)
      ).to.revertedWithCustomError(EMSInstance, "EMS__NotFoundError");
    });
  });

  describe("Fire Employee", async () => {
    it("should update employee's status to unemployed", async () => {
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

      await EMSInstance.fireEmployee(john.address);

      const { status } = await EMSInstance.getEmployee(john.address);

      expect(status).to.equal(Status.UNEMPLOYED);
    });

    it("should revert if employee does not exist", async () => {
      const [_, john, nobody] = await ethers.getSigners();

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

      await expect(
        EMSInstance.fireEmployee(nobody.address)
      ).to.revertedWithCustomError(EMSInstance, "EMS__NotFoundError");
    });
  });
});
