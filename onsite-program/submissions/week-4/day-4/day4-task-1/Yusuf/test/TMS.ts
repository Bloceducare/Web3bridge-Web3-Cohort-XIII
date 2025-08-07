import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("TMS", function () {
  
  async function deployTMS() {
  
    // Contracts are deployed using the first signer/account by default
    const [owner, account2,account3] = await hre.ethers.getSigners();

    const TMS = await hre.ethers.getContractFactory("TMS");
    const tms = await TMS.deploy({value: hre.ethers.parseEther("1") });

    return { tms,  owner, account2, account3, value: hre.ethers.parseEther("1") };
  }

  describe("Deployment", function () {
    it("Should deploy and set owner correctly", async function () {
      const { tms, owner} = await loadFixture(deployTMS);

      expect(await tms.owner()).to.equal(owner.address);
    });

    it("Contract should receive the funds on deploy", async function () {
      const { tms, value} = await loadFixture(deployTMS);

      expect(await hre.ethers.provider.getBalance(tms.target)).to.equal(value);
    });

  });
  describe("Register Staff", function () {
    it("Should register staff correctly", async function () {
      const { tms, account2 } = await loadFixture(deployTMS);
      const tx = await tms.register_staff(account2.address, "Alice", 1000, 0, 0);
      await tx.wait();

      const staff = await tms.address_to_staff(account2.address);
      expect(staff.name).to.equal("Alice");
      expect(staff.amount).to.equal(1000);
      expect(staff.status).to.equal(0); 
    });
  });
  describe("Pay Staff", function () {
    it("Should pay staff correctly", async function () {
      const { tms, account2 } = await loadFixture(deployTMS);
      const tx = await tms.register_staff(account2.address, "Alice", 1000, 0, 0);
      await tx.wait();

      const payTx = await tms.pay_staff(account2.address);
      await payTx.wait();

      const staff = await tms.address_to_staff(account2.address);
      expect(staff.paid).to.be.true;
    });
  });
  describe("update_staff_salary", function () {
    it("Should update staff salary correctly", async function () {
      const { tms, account2 } = await loadFixture(deployTMS);
      const tx = await tms.register_staff(account2.address, "Alice", 1000, 0, 0);
      await tx.wait();

      const updateTx = await tms.update_staff_salary(account2.address, 1500);
      await updateTx.wait();

      const staff = await tms.address_to_staff(account2.address);
      expect(staff.amount).to.equal(1500);
    });
  });
  describe("get_all_staff", function () {
    it("Should return all staff", async function () {
      const { tms, account2, account3 } = await loadFixture(deployTMS);
      await tms.register_staff(account2.address, "Alice", 1000, 0, 0);
      await tms.register_staff(account3.address, "Bob", 2000, 0, 0);

      const allStaff = await tms.get_all_staff();
      expect(allStaff.length).to.equal(2);
      expect(allStaff[0].name).to.equal("Alice");
      expect(allStaff[1].name).to.equal("Bob");
    });
  });
  describe("delete_staff", function () {
    it("Should delete staff correctly", async function () {
      const { tms, account2 } = await loadFixture(deployTMS);
      await tms.register_staff(account2.address, "Alice", 1000, 0, 0);

      const deleteTx = await tms.delete_staff(account2.address);
      await deleteTx.wait();

      const staff = await tms.address_to_staff(account2.address);
      expect(staff.name).to.equal("");
      expect(staff.amount).to.equal(0);
    });
  });
 // describe("check_pay", function () {")

})