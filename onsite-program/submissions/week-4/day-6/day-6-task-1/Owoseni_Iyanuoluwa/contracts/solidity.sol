const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");

describe("ManagementFactory and Management", function () {
  let factory;
  let management;
  let owner, employee1, employee2;

  beforeEach(async function () {
    [owner, employee1, employee2] = await hre.ethers.getSigners();

    // Deploy the factory contract
    const ManagementFactory = await hre.ethers.getContractFactory("ManagementFactory");
    factory = await ManagementFactory.deploy();

    // Create a new Management contract via the factory
    const tx = await factory.createManagementContract();
    const receipt = await tx.wait();
    const managementAddress = receipt.logs[0].args.contractAddress; // Extract from event
    management = await hre.ethers.getContractAt("Management", managementAddress);
  });

  describe("Factory Deployment", function () {
    it("Should deploy a new Management contract", async function () {
      const initialCount = await factory.getContractCount();
      await factory.createManagementContract();
      expect(await factory.getContractCount()).to.equal(Number(initialCount) + 1);
    });

    it("Should emit ManagementContractCreated event", async function () {
      await expect(factory.createManagementContract())
        .to.emit(factory, "ManagementContractCreated")
        .withArgs(hre.ethers.isAddress, owner.address);
    });

    it("Should track deployed Management contracts", async function () {
      await factory.createManagementContract();
      await factory.createManagementContract();
      const deployedContracts = await factory.getDeployedContracts();
      expect(deployedContracts.length).to.equal(3); // Including the one from beforeEach
    });
  });

  describe("Management Contract Functionality", function () {
    it("Should set the correct owner", async function () {
      expect(await management.owner()).to.equal(owner.address);
    });

    it("Should allow owner to create an employee", async function () {
      await management.createEmployee(employee1.address, "Alice", 1000, 0); // Role: Mentor
      const employee = await management.employees(employee1.address);
      expect(employee.name).to.equal("Alice");
      expect(employee.salary).to.equal(1000);
      expect(employee.status).to.equal(0); // Manage.employed
      expect(employee.exists).to.be.true;
      expect(employee.employeeAddress).to.equal(employee1.address);
      expect(employee.role).to.equal(0); // roles.Mentor
    });

    it("Should revert if employee already exists", async function () {
      await management.createEmployee(employee1.address, "Alice", 1000, 0);
      await expect(
        management.createEmployee(employee1.address, "Alice", 1000, 0)
      ).to.be.revertedWithCustomError(management, "EmployeeAlreadyExists");
    });

    it("Should allow owner to fund the contract", async function () {
      const amount = ethers.parseEther("1");
      await management.fundOwner({ value: amount });
      expect(await management.getContractBalance()).to.equal(amount);
      expect(await management.balances(owner.address)).to.equal(amount);
    });

    it("Should revert if non-owner tries to fund", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        management.connect(employee1).fundOwner({ value: amount })
      ).to.be.revertedWith("Only owner can fund");
    });

    it("Should allow owner to transfer salary to employee", async function () {
      // Fund the contract
      const salary = 1000;
      await management.fundOwner({ value: ethers.parseEther("1") });

      // Create an employee
      await management.createEmployee(employee1.address, "Alice", salary, 0);

      // Transfer salary
      await expect(management.transfer(employee1.address, salary))
        .to.emit(management, "Transfer")
        .withArgs(owner.address, employee1.address, salary);
      expect(await management.balances(employee1.address)).to.equal(salary);
      expect(await management.balances(owner.address)).to.equal(ethers.parseEther("1") - salary);
    });

    it("Should revert transfer to non-existent employee", async function () {
      await expect(
        management.transfer(employee1.address, 1000)
      ).to.be.revertedWith("Recipient is not an employee");
    });

    it("Should revert transfer to zero address", async function () {
      await expect(
        management.transfer(ethers.ZeroAddress, 1000)
      ).to.be.revertedWithCustomError(management, "InvalidRecipient");
    });

    it("Should revert if non-owner tries to transfer", async function () {
      await management.createEmployee(employee1.address, "Alice", 1000, 0);
      await expect(
        management.connect(employee1).transfer(employee1.address, 1000)
      ).to.be.revertedWith("Only owner can call");
    });

    it("Should revert if salary does not match", async function () {
      await management.fundOwner({ value: ethers.parseEther("1") });
      await management.createEmployee(employee1.address, "Alice", 1000, 0);
      await expect(
        management.transfer(employee1.address, 500)
      ).to.be.reverted;
    });

    it("Should revert if insufficient balance", async function () {
      await management.createEmployee(employee1.address, "Alice", 1000, 0);
      await expect(
        management.transfer(employee1.address, 1000)
      ).to.be.revertedWithCustomError(management, "InsufficientBalance");
    });

    it("Should return correct contract balance", async function () {
      const amount = ethers.parseEther("1");
      await management.fundOwner({ value: amount });
      expect(await management.getContractBalance()).to.equal(amount);
    });
  });
});