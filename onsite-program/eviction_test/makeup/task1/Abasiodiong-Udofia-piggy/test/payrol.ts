import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("NarutoChakraPayroll", function () {
  async function deployPayrollFixture() {
    const [owner, employee1, employee2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy();
    await token.waitForDeployment();

    const NarutoChakraPayroll = await ethers.getContractFactory("NarutoChakraPayroll");
    const payroll = await NarutoChakraPayroll.deploy(await token.getAddress());
    await payroll.waitForDeployment();

    // Fund contract with tokens
    const fundAmount = ethers.parseUnits("1000", 6);
    await token.transfer(await payroll.getAddress(), fundAmount);

    return { payroll, token, owner, employee1, employee2, fundAmount };
  }

  describe("Deployment", function () {
    it("Should deploy without errors and set correct token", async function () {
      const { payroll, token } = await loadFixture(deployPayrollFixture);
      expect(payroll).to.not.be.undefined;
      expect(await payroll.payrollToken()).to.equal(await token.getAddress());
    });
  });

  describe("Employee Registration", function () {
    it("Should register employee and emit event", async function () {
      const { payroll, employee1 } = await loadFixture(deployPayrollFixture);
      const salary = ethers.parseUnits("100", 6);
      await expect(payroll.registerEmployee("Naruto", employee1.address, salary))
        .to.emit(payroll, "EmployeeRegistered")
        .withArgs(1, "Naruto", employee1.address, salary);
    });
  });

  describe("Check-in", function () {
    it("Should allow check-in and emit event", async function () {
      const { payroll, employee1 } = await loadFixture(deployPayrollFixture);
      await payroll.registerEmployee("Naruto", employee1.address, 100);
      await expect(payroll.connect(employee1).checkIn(1))
        .to.emit(payroll, "EmployeeCheckedIn")
        .withArgs(1, 1);
    });

    it("Should revert if not registered", async function () {
      const { payroll, employee1 } = await loadFixture(deployPayrollFixture);
      await expect(payroll.connect(employee1).checkIn(1))
        .to.be.revertedWith("Employee not registered");
    });

    it("Should revert if checked in twice in one day", async function () {
      const { payroll, employee1 } = await loadFixture(deployPayrollFixture);
      await payroll.registerEmployee("Naruto", employee1.address, 100);
      await payroll.connect(employee1).checkIn(1);
      await expect(payroll.connect(employee1).checkIn(1))
        .to.be.revertedWith("Already checked in today");
    });
  });

  describe("Payout", function () {
    async function setupFiveCheckIns() {
      const { payroll, employee1, token } = await loadFixture(deployPayrollFixture);
      await payroll.registerEmployee("Naruto", employee1.address, ethers.parseUnits("100", 6));
      for (let i = 0; i < 5; i++) {
        await payroll.connect(employee1).checkIn(1);
        await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // Advance 1 day
        await ethers.provider.send("evm_mine", []);
      }
      return { payroll, employee1, token };
    }

    it("Should allow payout only after 5 check-ins and emit event", async function () {
      const { payroll, employee1, token } = await loadFixture(setupFiveCheckIns);
      const initialBalance = await token.balanceOf(employee1.address);
      await expect(payroll.connect(employee1).requestPayout(1))
        .to.emit(payroll, "PayoutReceived")
        .withArgs(1, ethers.parseUnits("100", 6));
      const finalBalance = await token.balanceOf(employee1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("100", 6));
    });

    it("Should revert if not enough check-ins", async function () {
      const { payroll, employee1 } = await loadFixture(deployPayrollFixture);
      await payroll.registerEmployee("Naruto", employee1.address, 100);
      await payroll.connect(employee1).checkIn(1);
      await expect(payroll.connect(employee1).requestPayout(1))
        .to.be.revertedWith("Incomplete check-ins");
    });

    it("Should reset check-in count after payout", async function () {
      const { payroll, employee1 } = await loadFixture(setupFiveCheckIns);
      await payroll.connect(employee1).requestPayout(1);
      const employee = await payroll.employees(1);
      expect(employee.checkInCount).to.equal(0);
    });

    it("Should transfer tokens correctly", async function () {
      const { payroll, employee1, token } = await loadFixture(setupFiveCheckIns);
      const initialBalance = await token.balanceOf(employee1.address);
      await payroll.connect(employee1).requestPayout(1);
      const finalBalance = await token.balanceOf(employee1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("100", 6));
    });
  });
});