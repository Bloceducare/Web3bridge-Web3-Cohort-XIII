import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Access Control Test", function () {
  async function deployAccessControl() {
    const AccessControl = await hre.ethers.getContractFactory("Web3Access");

    const [admin, otherAccount] = await hre.ethers.getSigners();

    const accessControl = await AccessControl.deploy();

    return { accessControl, admin, otherAccount };
  }

  describe("Add staff", function () {
    it("should add a staff successfully", async function () {
      const { accessControl, otherAccount } = await loadFixture(
        deployAccessControl
      );

      const staffName = "Felix David";
      const staffPosition = 2;
      const staffAddress = otherAccount.address;

      await accessControl.add_staff(staffAddress, staffName, staffPosition);

      const staffData = await accessControl.get_all_staff();

      const staff = staffData[0];

      expect(staff.name).to.equal(staffName);
    });
  });

  describe("Update staff", function () {
    it("staff should update their data successfully", async function () {
      const { accessControl, otherAccount } = await loadFixture(
        deployAccessControl
      );

      const staffName = "Felix David";
      const staffPosition = 2;
      const staffAddress = otherAccount.address;
      const id = 1;

      await accessControl.update_staff(
        id,
        staffName,
        staffAddress,
        staffPosition
      );

      const staffData = await accessControl.get_one_staff(otherAccount.address);

      expect(staffData.name).to.equal(staffName);
    });
  });

  describe("Admin Update staff", function () {
    it("admin should add a staff successfully", async function () {
      const { accessControl, admin, otherAccount } = await loadFixture(
        deployAccessControl
      );

      const staffName = "Felix David";
      const staffPosition = 2;
      const staffAddress = admin.address;
      const id = 0;
      const ifEmployed = true;

      await accessControl
        .connect(admin)
        .admin_update_staff(
          staffAddress,
          id,
          staffName,
          staffPosition,
          ifEmployed
        );

      const staffData = await accessControl.get_one_staff(otherAccount.address);

      expect(staffData.uid).to.equal(id);
    });
  });

  describe("Admin Dismissal of staff", function () {
    it("admin should sack staff successfully", async function () {
      const { accessControl, admin } = await loadFixture(deployAccessControl);

      const ifEmployed = false;

      await accessControl.admin_staff_dismissal(admin, 0);

      const staffData = await accessControl.get_all_staff();

      const change_employment = staffData[0].isWorking;

      expect(change_employment).to.equal(ifEmployed);
    });
  });
});
