import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ManagementSystem", () => {
  async function deployContract() {
    const [owner, employee1, otherAccount] = await ethers.getSigners(); 
    const MyContract = await ethers.getContractFactory("ManagementSystem");
    const deployedContract = await MyContract.deploy();
    return { deployedContract, owner, employee1, otherAccount };
  }

  // Test registerEmployee
  describe("Test registerEmployee function", () => {
    it("Should register employee successfully", async () => {
      const { deployedContract: contract, owner, employee1 } = await loadFixture(deployContract);
      
      await contract.registerEmployee(employee1.address, "John", 0, 1000);
      const employee = await contract.getEmployee(employee1.address);
      
      expect(employee.name).to.equal("John");
      expect(employee.salary).to.equal(1000);
      expect(employee.isEmployed).to.equal(true);0
    });

    it("Should revert if not owner", async () => {
      const { deployedContract: contract, employee1, otherAccount } = await loadFixture(deployContract);
      
      await expect(
        contract.connect(otherAccount).registerEmployee(employee1.address, "John", 0, 1000)
      ).to.be.reverted;
    });

    it("Should revert if salary is 0", async () => {
      const { deployedContract: contract, employee1 } = await loadFixture(deployContract);
      
      await expect(
        contract.registerEmployee(employee1.address, "John", 0, 0)
      ).to.be.reverted;
    });
  });

  // Test paySalary
  describe("Test paySalary function", () => {
    it("Should pay salary successfully", async () => {
      const { deployedContract: contract, owner, employee1 } = await loadFixture(deployContract);
      
      await contract.registerEmployee(employee1.address, "John", 0, 1000);
      
      // Send ETH to contract
      await owner.sendTransaction({
        to: contract.target,
        value: ethers.parseEther("1")
      });

      await contract.paySalary(employee1.address, 500);
      // If no revert, payment was successful
    });

    it("Should revert if employee not registered", async () => {
      const { deployedContract: contract, employee1 } = await loadFixture(deployContract);
      
      await expect(
        contract.paySalary(employee1.address, 500)
      ).to.be.reverted;
    });

    it("Should revert if not owner", async () => {
      const { deployedContract: contract, owner, employee1, otherAccount } = await loadFixture(deployContract);
      
      await contract.registerEmployee(employee1.address, "John", 0, 1000);
      
      await expect(
        contract.connect(otherAccount).paySalary(employee1.address, 500)
      ).to.be.reverted;
    });
  });

  // Test getAllEmployees
  describe("Test getAllEmployees function", () => {
    it("Should return all employees", async () => {
      const { deployedContract: contract, employee1 } = await loadFixture(deployContract);
      
      await contract.registerEmployee(employee1.address, "John", 0, 1000);
      const employees = await contract.getAllEmployees();
      
      expect(employees.length).to.equal(1);
      expect(employees[0]).to.equal(employee1.address);
    });

    it("Should return empty array initially", async () => {
      const { deployedContract: contract } = await loadFixture(deployContract);
      
      const employees = await contract.getAllEmployees();
      expect(employees.length).to.equal(0);
    });
  });
});