import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

enum StudentStatus {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

describe("Deploy SMS", function () {
  async function deploySMS() {
    const [owner] = await hre.ethers.getSigners();

    const studentRecord = await hre.ethers.getContractFactory("StudentRecord");
    const record = await studentRecord.deploy();

    return { record, owner };
  }

  describe("Create a student instance", function () {
    it("Should register a student", async function () {
      const { record } = await loadFixture(deploySMS);
      const name = "Abdul Gafar";
      const age = 18;
      await record.register_student(name, age);
      const allStudent = await record.get_all_students();
      expect(allStudent[0].name).to.be.equal(name);
      expect(allStudent[0].age).to.be.equal(age);
    });
  });

  describe("Update a student", function() {
    it("should update a user", async function() {
      const { record, owner } = await loadFixture(deploySMS);
      const name = "Abdul Gafar";
      const age = 18;
      const _new_name = "Abdul-Gafar";
      const _new_age = 20;
      await record.register_student(name, age);
      await record.update_student(_new_name, _new_age, StudentStatus.DEFERRED);
      const get_user = await record.get_student_by_id(owner.address);

      expect(get_user.name).to.be.equal(_new_name);
      expect(get_user.age).to.be.equal(_new_age);
      expect(get_user.status).to.be.equal(StudentStatus.DEFERRED);
    })
  });

  describe("Delete a student instance", function() {
    it("should delete a user record", async function() {
      const { record, owner } = await loadFixture(deploySMS);
      const name = "Abdul Gafar";
      const age = 18;
      await record.register_student(name, age);
      await record.remove_student();
      const get_user = await record.get_student_by_id(owner.address);
      console.log("Deleted User", get_user);

      expect(get_user.name).to.be.equal("");
      expect(get_user.age).to.be.equal("");
      expect(get_user.status).to.be.equal("");
    })
  });
});
