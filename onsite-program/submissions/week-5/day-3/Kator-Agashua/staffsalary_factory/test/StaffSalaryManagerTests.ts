import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { should } from "chai";
should();
import hre from "hardhat";

describe("StaffSalaryManager", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function staffSalaryManagerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const StaffSalaryManager = await hre.ethers.getContractFactory(
      "StaffSalaryManager"
    );
    const staffSalaryManager = await StaffSalaryManager.deploy();

    return { staffSalaryManager, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should should set the deployer as the owner", async function () {
      const { staffSalaryManager, owner } = await loadFixture(
        staffSalaryManagerFixture
      );

      owner.should.be.equal(await staffSalaryManager.owner());
    });

    it("Should set the right address for the contract", async function () {
      const { staffSalaryManager } = await loadFixture(
        staffSalaryManagerFixture
      );
      const address = await staffSalaryManager.getAddress();
      address.should.be.equal(await staffSalaryManager.target);
    });
  });

  describe("Add Staff", function () {
    it("Should add a staff to the list of Staff: allStaff", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 0);
      await staffSalaryManager.allStaff(0);
      const totalStaff = await staffSalaryManager.getTotalStaffs();
      totalStaff.should.equal(1);
    });

    it("Should check if name of first staff is correct", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "Jane Doe", 0);

      const staff = await staffSalaryManager.allStaff(0);
      staff.name.should.equal("Jane Doe");
    });

    it("Should check if salary is right by role", async function () {
      const { staffSalaryManager, owner, addr1, addr2, addr3 } =
        await loadFixture(staffSalaryManagerFixture);
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 0);
      await staffSalaryManager.connect(owner).addStaff(addr2, "Jane Doe", 1);
      await staffSalaryManager.connect(owner).addStaff(addr3, "Alexi Lalas", 2);
      (await staffSalaryManager.allStaff(0)).salary.should.equal(1000);
      (await staffSalaryManager.allStaff(1)).salary.should.equal(1100);
      (await staffSalaryManager.allStaff(2)).salary.should.equal(500);
    });
  });

  describe("Update Staff", function () {
    it("Should update a staff", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 2);
      // (await staffSalaryManager.allStaff(0)).name;
      const status = (await staffSalaryManager.getStaff(addr1)).status;
      const role = (await staffSalaryManager.getStaff(addr1)).role;
      status.should.equal(0);
      role.should.equal(2);
      // const totalStaff = await staffSalaryManager.getTotalStaffs();
      // await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 1);
      // staff.status.should.equal(1);
      // staff.status.should.equal(1);
    });

    it("Should update a staff", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 2);
      await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 1);
      const status = (await staffSalaryManager.getStaff(addr1)).status;
      const role = (await staffSalaryManager.getStaff(addr1)).role;
      status.should.equal(1);
      role.should.equal(1);
    });

    it("Should check if salary is right by status", async function () {
      const { staffSalaryManager, owner, addr1, addr2 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 0);
      await staffSalaryManager.connect(owner).addStaff(addr2, "Jane Doe", 1);
      await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 0);
      await staffSalaryManager.connect(owner).updateStaff(addr2, 2, 0);
      (await staffSalaryManager.getStaff(addr1)).salary.should.equal(700);
      (await staffSalaryManager.getStaff(addr2)).salary.should.equal(0);
    });
  });

  describe("Payment", function () {
    it("Should update a staff", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 2);
      // (await staffSalaryManager.allStaff(0)).name;
      const status = (await staffSalaryManager.getStaff(addr1)).status;
      const role = (await staffSalaryManager.getStaff(addr1)).role;
      status.should.equal(0);
      role.should.equal(2);
      // const totalStaff = await staffSalaryManager.getTotalStaffs();
      // await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 1);
      // staff.status.should.equal(1);
      // staff.status.should.equal(1);
    });

    it("Should update a staff", async function () {
      const { staffSalaryManager, owner, addr1 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 2);
      await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 1);
      const status = (await staffSalaryManager.getStaff(addr1)).status;
      const role = (await staffSalaryManager.getStaff(addr1)).role;
      status.should.equal(1);
      role.should.equal(1);
    });

    it("Should check if salary is right by status", async function () {
      const { staffSalaryManager, owner, addr1, addr2 } = await loadFixture(
        staffSalaryManagerFixture
      );
      await staffSalaryManager.connect(owner).addStaff(addr1, "John Doe", 0);
      await staffSalaryManager.connect(owner).addStaff(addr2, "Jane Doe", 1);
      await staffSalaryManager.connect(owner).updateStaff(addr1, 1, 0);
      await staffSalaryManager.connect(owner).updateStaff(addr2, 2, 0);
      (await staffSalaryManager.getStaff(addr1)).salary.should.equal(700);
      (await staffSalaryManager.getStaff(addr2)).salary.should.equal(0);
    });
  });
});
