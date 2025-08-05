import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("GarageAccess Contract", function () {
  async function deployGarageAccess() {
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const GarageAccess = await hre.ethers.getContractFactory("GarageAccess");
    const garageAccess = await GarageAccess.deploy();

    return { garageAccess, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { garageAccess, owner } = await loadFixture(deployGarageAccess);
      expect(await garageAccess.owner()).to.equal(owner.address);
    });
  });

  describe("Employee Management", function () {
    it("Should add a new employee correctly", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      const name = "John Doe";
      const role = 0; // MediaTeam
      const isEmployed = true;

      await garageAccess.addOrUpdateEmployee(addr1.address, name, role, isEmployed);
      const [empName, empRole, empIsEmployed] = await garageAccess.getEmployeeDetails(addr1.address);

      expect(empName).to.equal(name);
      expect(empRole).to.equal(role);
      expect(empIsEmployed).to.equal(isEmployed);
      expect(await garageAccess.getAllEmployees()).to.include(addr1.address);
    });

    it("Should update an existing employee correctly", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John Doe", 0, true);
      await garageAccess.addOrUpdateEmployee(addr1.address, "Jane Doe", 1, false); 

      const [empName, empRole, empIsEmployed] = await garageAccess.getEmployeeDetails(addr1.address);
      expect(empName).to.equal("Jane Doe");
      expect(empRole).to.equal(1);
      expect(empIsEmployed).to.equal(false);
      expect((await garageAccess.getAllEmployees()).length).to.equal(1); 
    });

    it("Should restrict addOrUpdateEmployee to owner", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      await expect(
        garageAccess.connect(addr1).addOrUpdateEmployee(addr1.address, "John Doe", 0, true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Garage Access", function () {
    it("Should grant access to valid roles", async function () {
      const { garageAccess, addr1, addr2, addr3 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 0, true); 
      await garageAccess.addOrUpdateEmployee(addr2.address, "Jane", 1, true); 
      await garageAccess.addOrUpdateEmployee(addr3.address, "Bob", 2, true); 

      expect(await garageAccess.canAccessGarage(addr1.address)).to.equal(true);
      expect(await garageAccess.canAccessGarage(addr2.address)).to.equal(true);
      expect(await garageAccess.canAccessGarage(addr3.address)).to.equal(true);
    });

    it("Should deny access to invalid roles or unemployed", async function () {
      const { garageAccess, addr1, addr2, addr3 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 3, true); 
      await garageAccess.addOrUpdateEmployee(addr2.address, "Jane", 0, false); 
      await garageAccess.addOrUpdateEmployee(addr3.address, "Bob", 5, true); 

      expect(await garageAccess.canAccessGarage(addr1.address)).to.equal(false);
      expect(await garageAccess.canAccessGarage(addr2.address)).to.equal(false);
      expect(await garageAccess.canAccessGarage(addr3.address)).to.equal(false);
    });
  });

  describe("Payment System", function () {
    it("Should deposit funds correctly", async function () {
      const { garageAccess, owner } = await loadFixture(deployGarageAccess);
      const depositAmount = hre.ethers.parseEther("1");

      await expect(
        garageAccess.depositFunds({ value: depositAmount })
      ).to.emit(garageAccess, "FundsDeposited").withArgs(owner.address, depositAmount);

      expect(await garageAccess.getContractBalance()).to.equal(depositAmount);
    });

    it("Should fail to deposit zero funds", async function () {
      const { garageAccess } = await loadFixture(deployGarageAccess);
      await expect(
        garageAccess.depositFunds({ value: 0 })
      ).to.be.revertedWith("Must deposit some Ether");
    });

    it("Should pay employee with garage access", async function () {
      const { garageAccess, owner, addr1 } = await loadFixture(deployGarageAccess);
      const paymentAmount = hre.ethers.parseEther("0.1");
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 0, true); 
      await garageAccess.depositFunds({ value: hre.ethers.parseEther("1") });

      const initialBalance = await hre.ethers.provider.getBalance(addr1.address);
      await expect(
        garageAccess.payEmployee(addr1.address)
      ).to.emit(garageAccess, "EmployeePaid").withArgs(addr1.address, paymentAmount, hre.ethers.provider.blockTimestamp);

      const [_, __, ___, lastPaymentTimestamp, totalPaymentsReceived] = await garageAccess.getEmployeeDetails(addr1.address);
      expect(totalPaymentsReceived).to.equal(paymentAmount);
      expect(lastPaymentTimestamp).to.be.closeTo(hre.ethers.provider.blockTimestamp, 100);
      expect(await hre.ethers.provider.getBalance(addr1.address)).to.be.gt(initialBalance);
    });

    it("Should fail to pay employee without garage access", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 3, true); 
      await garageAccess.depositFunds({ value: hre.ethers.parseEther("1") });

      await expect(
        garageAccess.payEmployee(addr1.address)
      ).to.be.revertedWith("Employee does not have garage access");
    });

    it("Should fail to pay with insufficient contract balance", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 0, true);

      await expect(
        garageAccess.payEmployee(addr1.address)
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should restrict payEmployee to owner", async function () {
      const { garageAccess, addr1, addr2 } = await loadFixture(deployGarageAccess);
      await garageAccess.addOrUpdateEmployee(addr1.address, "John", 0, true); 
      await garageAccess.depositFunds({ value: hre.ethers.parseEther("1") });

      await expect(
        garageAccess.connect(addr2).payEmployee(addr1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Fund Withdrawal", function () {
    it("Should withdraw funds correctly by owner", async function () {
      const { garageAccess, owner } = await loadFixture(deployGarageAccess);
      const depositAmount = hre.ethers.parseEther("1");
      const withdrawAmount = hre.ethers.parseEther("0.5");

      await garageAccess.depositFunds({ value: depositAmount });
      await expect(
        garageAccess.withdrawFunds(withdrawAmount)
      ).to.emit(garageAccess, "FundsWithdrawn").withArgs(owner.address, withdrawAmount);

      expect(await garageAccess.getContractBalance()).to.equal(hre.ethers.parseEther("0.5"));
    });

    it("Should fail to withdraw with insufficient balance", async function () {
      const { garageAccess } = await loadFixture(deployGarageAccess);
      await expect(
        garageAccess.withdrawFunds(hre.ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should restrict withdrawFunds to owner", async function () {
      const { garageAccess, addr1 } = await loadFixture(deployGarageAccess);
      await garageAccess.depositFunds({ value: hre.ethers.parseEther("1") });

      await expect(
        garageAccess.connect(addr1).withdrawFunds(hre.ethers.parseEther("0.5"))
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});