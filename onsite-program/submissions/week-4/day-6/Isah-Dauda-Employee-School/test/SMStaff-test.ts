import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementStaff Contract - Strict Tests", function () {
  async function deployStaffFixture() {
    const [chancellor, staff1, staff2, staff3, unauthorizedUser] =
      await hre.ethers.getSigners();

    const ContractFactory = await hre.ethers.getContractFactory(
      "SchoolManagementStaff"
    );
    const staffContract = await ContractFactory.deploy();

    const fundingAmount = hre.ethers.parseEther("10.0");
    await staffContract.fund({ value: fundingAmount });

    return {
      staffContract, chancellor, staff1, staff2, unauthorizedUser, fundingAmount,
    };
  }

  describe("Deployment", function () {
    it("Sets deployer as Chancellor", async function () {
      const { staffContract, chancellor } = await loadFixture(deployStaffFixture);
      expect(await staffContract.Chancellor()).to.equal(chancellor.address);
    });
  });

  describe("registerStaff", function () {
    it("Allows Chancellor to register staff", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      const salary = hre.ethers.parseEther("1.0");
      await staffContract.connect(chancellor).registerStaff(staff1.address, salary, 0);
      const data = await staffContract.staffData(staff1.address);
      expect(data.isEmployed).to.be.true;
    });

    it("Rejects non-Chancellor registration", async function () {
      const { staffContract, unauthorizedUser, staff1 } = await loadFixture(deployStaffFixture);
      await expect(
        staffContract.connect(unauthorizedUser).registerStaff(staff1.address, 1, 0)
      ).to.be.revertedWithCustomError(staffContract, "ONLY_CHANCELLOR");
    });

    it("Rejects invalid role or zero salary", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await expect(
        staffContract.connect(chancellor).registerStaff(staff1.address, 0, 0)
      ).to.be.revertedWith("Salary must be greater than zero");
      await expect(
        staffContract.connect(chancellor).registerStaff(staff1.address, 1, 5)
      ).to.be.revertedWith("Invalid Role");
    });

    it("Rejects already registered staff", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0);
      await expect(
        staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0)
      ).to.be.revertedWithCustomError(staffContract, "ALREADY_REGISTERED");
    });
  });

  describe("updateStaffStatus", function () {
    it("Updates status of existing staff", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0);
      await staffContract.connect(chancellor).updateStaffStatus(staff1.address, 2);
      const details = await staffContract.getStaffDetails(staff1.address);
      expect(details[1]).to.equal(2);
    });

    it("Rejects non-Chancellor or unregistered", async function () {
      const { staffContract, unauthorizedUser, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await expect(
        staffContract.connect(chancellor).updateStaffStatus(staff1.address, 1)
      ).to.be.revertedWithCustomError(staffContract, "NOT_REGISTERED");

      await staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0);
      await expect(
        staffContract.connect(unauthorizedUser).updateStaffStatus(staff1.address, 1)
      ).to.be.revertedWithCustomError(staffContract, "ONLY_CHANCELLOR");
    });
  });

  describe("payStaff", function () {
    it("Pays valid employed staff", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0);
      await expect(
        staffContract.connect(chancellor).payStaff(staff1.address, 1)
      ).to.not.be.reverted;
    });

    it("Rejects payment if not employed or insufficient balance", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await expect(
        staffContract.connect(chancellor).payStaff(staff1.address, 1)
      ).to.be.revertedWithCustomError(staffContract, "NOT_REGISTERED");

      await staffContract.connect(chancellor).registerStaff(staff1.address, 1, 0);
      await staffContract.connect(chancellor).updateStaffStatus(staff1.address, 1);
      await expect(
        staffContract.connect(chancellor).payStaff(staff1.address, 1)
      ).to.be.revertedWithCustomError(staffContract, "NOT_EMPLOYED");
    });
  });

  describe("Get Details", function () {
    it("Returns correct salary and details", async function () {
      const { staffContract, chancellor, staff1 } = await loadFixture(deployStaffFixture);
      await staffContract.connect(chancellor).registerStaff(staff1.address, 5, 1);
      expect(await staffContract.staffSalary(staff1.address)).to.equal(5);
      const details = await staffContract.getStaffDetails(staff1.address);
      expect(details[0]).to.equal(5);
      expect(details[2]).to.equal(1);
    });

    it("Returns all staff Records", async function () {
      const { staffContract, chancellor, staff1, staff2 } = await loadFixture(deployStaffFixture);
      await staffContract.connect(chancellor).registerStaff(staff1.address, 5, 0);
      await staffContract.connect(chancellor).registerStaff(staff2.address, 10, 2);
      const all = await staffContract.getAllStaffs();
      expect(all[0]).to.include.members([staff1.address, staff2.address]);
    });
  });

  describe("Funding", function () {
    it("Accepts funds via all paths", async function () {
      const { staffContract, chancellor } = await loadFixture(deployStaffFixture);
      await expect(
        chancellor.sendTransaction({ to: await staffContract.getAddress(), value: 1 })
      ).to.changeEtherBalance(staffContract, 1);
      await expect(
        chancellor.sendTransaction({ to: await staffContract.getAddress(), value: 1, data: "0x1234" })
      ).to.changeEtherBalance(staffContract, 1);
    });
  });
});
