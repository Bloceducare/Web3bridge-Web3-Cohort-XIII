import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("StudentSchool", function () {
  async function deployStudentSchool() {
    const [owner] = await hre.ethers.getSigners();

    const Student = await hre.ethers.getContractFactory("StudentSchool");
    const student = await Student.deploy({ value: hre.ethers.parseEther("5") });
   

    return { student , owner};
  }

  describe("register", function () {
    it("should register student", async function () {
      const { student } = await loadFixture(deployStudentSchool);

      const name = "thompson";
      const age = 25;

      await student.register(name, age);

      const get_students = await student.get_all();
      const get_students_details = get_students[0];

      expect(get_students_details.name).to.equal(name);
      expect(get_students_details.age).to.equal(age);
    });
  });

  describe("pay salary", function () {
    it("should transfer salary to receiver", async function () {
      const { student } = await loadFixture(deployStudentSchool);
      const [owner, receiver] = await hre.ethers.getSigners();

      await student.register("thompson", 25);

      const initialReceiverBalance = await hre.ethers.provider.getBalance(
        receiver.address
      );

      const tx = await student
        .connect(owner)
        .pay_salary(receiver.address, hre.ethers.parseEther("1"));
      await tx.wait();

      const receiverBalance = await hre.ethers.provider.getBalance(
        receiver.address
      );

      expect(receiverBalance).to.equal(
        initialReceiverBalance + hre.ethers.parseEther("1")
      );
    });
  });
});
