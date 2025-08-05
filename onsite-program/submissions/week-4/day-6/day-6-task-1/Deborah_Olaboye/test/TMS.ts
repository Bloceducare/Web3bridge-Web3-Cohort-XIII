import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";

describe("Teacher Management System", function () {
  async function deployTMSFixture() {
    const TMS = await ethers.getContractFactory("TMS");
    const tms = await TMS.deploy();
    return { tms };
  }

  describe("Deployment", function () {
    it("Should deploy the contract and set the owner", async function () {
      const { tms } = await loadFixture(deployTMSFixture);
      const [owner] = await ethers.getSigners();
      expect(await tms.owner()).to.equal(owner.address);
    });
  });

  describe("Register Teacher", function () {
    it("Should register teachers correctly", async function () {
      const { tms } = await loadFixture(deployTMSFixture);
      await tms.RegisterTeacher("Deborah", 200000, 0);
      await tms.RegisterTeacher("Esther", 6000000, 1);
      const teachers = await tms.ViewTeachers();
      expect(teachers.length).to.equal(2);
      expect(teachers[0].name).to.equal("Deborah");
      expect(teachers[0].salary).to.equal(200000);
      expect(teachers[0].status).to.equal(0);
    });
  });

  describe("Pay Salary", function () {
    it("Should pay salary to an EMPLOYED teacher", async function () {
      const { tms } = await loadFixture(deployTMSFixture);
      const [owner, teacher] = await ethers.getSigners();
      await tms.connect(teacher).RegisterTeacher("Deborah", parseEther("1"), 0);
      await owner.sendTransaction({
        to: tms.address,
        value: parseEther("1"),
      });
      await expect(() =>
        tms.PaySalary("Deborah", teacher.address)
      ).to.changeEtherBalance(teacher, parseEther("1"));
    });

    it("Should revert if teacher name not found", async function () {
      const { tms } = await loadFixture(deployTMSFixture);
      const [, teacher] = await ethers.getSigners();
      await expect(
        tms.PaySalary("Unknown", teacher.address)
      ).to.be.revertedWithCustomError(tms, "NOT_FOUND");
    });

    it("Should revert if teacher is UNEMPLOYED", async function () {
      const { tms } = await loadFixture(deployTMSFixture);
      const [owner, teacher] = await ethers.getSigners();
      await tms.connect(teacher).RegisterTeacher("Esther", parseEther("0.5"), 1);
      await owner.sendTransaction({
        to: tms.address,
        value: parseEther("1"),
      });
      await expect(
        tms.PaySalary("Esther", teacher.address)
      ).to.be.revertedWith("Teacher not eligible for salary");
    });
  });
});
