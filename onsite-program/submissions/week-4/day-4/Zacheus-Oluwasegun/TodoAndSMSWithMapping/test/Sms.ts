import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { SchoolManagementSystem } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

describe("Sms", () => {
  let smsContract: SchoolManagementSystem;
  let owner: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  async function deploySmsFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const Sms = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const sms = await Sms.deploy();

    return {
      sms,
      otherAccount,
      owner,
    };
  }

  before("preset", async () => {
    const fixture = await loadFixture(deploySmsFixture);
    smsContract = fixture.sms;
    owner = fixture.owner;
    otherAccount = fixture.otherAccount;
  });

  describe("Registration flow", () => {
    it("register student in school of the owner", async () => {
      const _name = "Zach";
      const _course = "CSC";
      const _age = 24;
      // await smsContract.register_student(_name, _course, _age);
      await smsContract.another_registration({id : 1,name :_name, age:  _age, course: _course, status: 0})

      // you can seperate this into two different tests, check length to confirm registration, then check details with id to confirm getStudentById works
      expect((await smsContract.get_all_students()).length).to.equal(1);
      expect((await smsContract.get_student_by_id(1)).id).to.be.equal(1);
      expect((await smsContract.get_student_by_id(1)).name).to.be.equal(_name);
      expect((await smsContract.get_student_by_id(1)).course).to.be.equal(
        _course
      );
      expect((await smsContract.get_student_by_id(1)).age).to.be.equal(_age);
    });
  });

  describe("Update Student", () => {
    it("update student status", async () => {
      const _name = "Emmanuel";
      const _course = "AGE";
      const _age = 22;

      await smsContract.register_student(_name, _course, _age);
      expect(
        smsContract.update_students_status(3, 2)
      ).to.be.revertedWithCustomError(smsContract, "INVALID_ID");

      await smsContract.update_students_status(1, 2);
      expect((await smsContract.get_student_by_id(1)).status).to.equal(2);
    });

    it("update student", async () => {     
      await smsContract.update_student(2, "Daniel");

      expect((await smsContract.get_student_by_id(2)).name).to.equal("Daniel");
      expect(((await smsContract.get_all_students()).length)).to.equal(2);
    });

    it("should delete student details", async ()=>{
      await smsContract.delete_student(1)

      expect((await smsContract.get_all_students()).length).to.equal(1)
      expect(smsContract.delete_student(1)).to.be.revertedWithCustomError(smsContract, "STUDENT_NOT_FOUND")
    })
  });
});
