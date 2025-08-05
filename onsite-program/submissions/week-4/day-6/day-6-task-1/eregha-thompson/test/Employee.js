import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import hre from "hardhat";

describe("StudentSchool", function () {
  async function deployStudentSchool() {
    const [owner, otherAddress, thirdAddress] = await hre.ethers.getSigners();

    const Student = await hre.ethers.getContractFactory("StudentSchool");
    const student = await Student.deploy({ value: ethers.parseEther("5") });

    return { student, owner, otherAddress, thirdAddress };
  }

  describe("Deloyment", function () {
    it("should deploy succesfully", async function () {
      const { student } = await loadFixture(deployStudentSchool);
      expect(await student.getAddress()).to.be.properAddress;
    });
  });

  describe("studentmanagement", function () {
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
    it("should update student", async function () {
      const { student } = await loadFixture(deployStudentSchool);

      const name = "thompson";
      const age = 25;

      const newName = "thompson update";
      const newAge = 40;

      await student.register(name, age);

      await student.update(newName, newAge, 0);

      const get_students = await student.get_all();
      const get_students_details = get_students[0];

      expect(get_students_details.name).to.equal(newName);
      expect(get_students_details.age).to.equal(newAge);
    });
    it("should get all students", async function () {
      const { student, owner, otherAddress, thirdAddress } = await loadFixture(
        deployStudentSchool
      );

      await student.connect(owner).register("thompson", 25);
      await student.connect(otherAddress).register("name4", 2);
      await student.connect(thirdAddress).register("name5", 3);

      const get_students = await student.get_all();

      expect(get_students.length).to.equal(3);

      // expect(get_students[0].owner).to.equal(owner.address);
      // expect(get_students[1].owner).to.equal(otherAddress.address);
      // expect(get_students[2].owner).to.equal(thirdAddress.address);
    });
    it("should get student by address", async function () {
      const { student, owner, otherAddress, thirdAddress } = await loadFixture(
        deployStudentSchool
      );

      await student.connect(owner).register("thompson", 25);
      await student.connect(otherAddress).register("name4", 2);
      await student.connect(thirdAddress).register("name5", 3);

      const get_students = await student.get_all();

      // expect(get_students.length).to.equal(3);

      expect(get_students[0].owner).to.equal(owner.address);
      expect(get_students[1].owner).to.equal(otherAddress.address);
      expect(get_students[2].owner).to.equal(thirdAddress.address);
    });
  });

  describe("pay salary", function () {
    it("should check the balance of the owner", async function () {
      const { student, owner, otherAddress, thirdAddress } = await loadFixture(
        deployStudentSchool
      );

      const ownerBalance = await ethers.provider.getBalance(owner.address);
      
    });
    it("should transfer from owner", async function () {
      const { student, owner, otherAddress } = await loadFixture(
        deployStudentSchool
      );

      await student.connect(otherAddress).register("Thompson", 25);
      await student.connect(owner).mint({ value: ethers.parseEther("5") });

      const initialReceiverBalance = await ethers.provider.getBalance(
        otherAddress.address
      );
      const initialContractBalance = await ethers.provider.getBalance(
        student.target
      );
      
      await student
        .connect(owner)
        .pay_salary(otherAddress.address, ethers.parseEther("1"));

      const finalReceiverBalance = await ethers.provider.getBalance(
        otherAddress.address
      );
      const finalContractBalance = await ethers.provider.getBalance(
        student.target
      );
     
      

      expect(finalReceiverBalance - initialReceiverBalance).to.equal(
        ethers.parseEther("1")
      );
      expect(initialContractBalance - finalContractBalance).to.equal(
        ethers.parseEther("1")
      );
    });

    // it("should mint token", async function () {
    //   const { student, owner, otherAddress, thirdAddress } = await loadFixture(
    //     deployStudentSchool
    //   );
    //   await student.connect(owner).mint(otherAddress, 1000);

    //   const balance = await student.balanceOf(otherAddress);
    //   expect(balance).to.equal(1000);
    // });
  });
});
