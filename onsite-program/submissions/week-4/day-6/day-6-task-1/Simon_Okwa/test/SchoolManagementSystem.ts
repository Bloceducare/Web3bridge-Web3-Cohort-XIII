import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, ZeroAddress } from "ethers";

describe("SchoolManagementSystem", function () {
  let school: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const School = await ethers.getContractFactory("SchoolManagementSystem");
    school = await School.deploy();
  });

  describe("Student Management", function () {
    it("should register a student", async function () {
      await school.connect(addr1).register_student("Alice", "Math", 20);
      const students = await school.connect(addr1).get_all_students();
      expect(students.length).to.equal(1);
      expect(students[0].name).to.equal("Alice");
      expect(students[0].course).to.equal("Math");
      expect(students[0].age).to.equal(20);
      expect(students[0].status).to.equal(0); // ACTIVE
    });

    it("should update a student name", async function () {
      await school.connect(addr1).register_student("Bob", "Physics", 22);
      const students = await school.connect(addr1).get_all_students();
      const id = students[0].id;
      await school.connect(addr1).update_student(id, "Bobby");
      const updated = await school.connect(addr1).get_student_by_id(id);
      expect(updated.name).to.equal("Bobby");
    });

    it("should update a student status", async function () {
      await school.connect(addr1).register_student("Carol", "Chemistry", 19);
      const students = await school.connect(addr1).get_all_students();
      const id = students[0].id;
      await school.connect(addr1).update_students_status(id, 2); // RUSTICATED
      const updated = await school.connect(addr1).get_student_by_id(id);
      expect(updated.status).to.equal(2);
    });

    it("should delete a student", async function () {
      await school.connect(addr1).register_student("Dave", "Biology", 21);
      const students = await school.connect(addr1).get_all_students();
      const id = students[0].id;
      await school.connect(addr1).delete_student(id);
      await expect(school.connect(addr1).get_student_by_id(id)).to.be.revertedWithCustomError(school, "STUDENT_NOT_FOUND");
    });

    it("should revert when updating non-existent student", async function () {
      await expect(school.connect(addr1).update_student(999, "Ghost")).to.be.revertedWithCustomError(school, "STUDENT_NOT_FOUND");
    });
  });

  describe("Employee Management", function () {
    it("should register an employee", async function () {
      await school.register_employee(addr2.address, "Eve", 0,parseEther("1"));
      const employees = await school.get_all_employees();
      expect(employees.length).to.equal(1);
      expect(employees[0].name).to.equal("Eve");
      expect(employees[0].role).to.equal(0); // MENTOR
      expect(employees[0].salary).to.equal(parseEther("1"));
      expect(employees[0].isEmployed).to.equal(true);
    });

    it("should revert if registering employee with zero address", async function () {
      await expect(
        school.register_employee(ZeroAddress, "Zero", 0, 1)
      ).to.be.revertedWithCustomError(school, "ZERO_ADDRESS");
    });

    it("should revert if registering employee with zero salary", async function () {
      await expect(
        school.register_employee(addr2.address, "Eve", 0, 0)
      ).to.be.revertedWithCustomError(school, "EXCEEDS_SALARY");
    });

    it("should revert if registering employee twice", async function () {
      await school.register_employee(addr2.address, "Eve", 0, 1);
      await expect(
        school.register_employee(addr2.address, "Eve", 0, 1)
      ).to.be.revertedWithCustomError(school, "EMPLOYEE_ALREADY_REGISTERED");
    });
  });

  describe("Salary Payment", function () {
    beforeEach(async function () {
      await school.register_employee(addr2.address, "Eve", 0, parseEther("1"));
    });

    it("should pay salary to employee", async function () {
      const salary = parseEther("1");
      const prevBal = await ethers.provider.getBalance(addr2.address);
      const tx = await school.pay_salary(addr2.address, { value: salary });
      await tx.wait();
      const newBal = await ethers.provider.getBalance(addr2.address);
      expect(newBal - prevBal).to.equal(salary);
    });

    it("should revert if paying more than salary", async function () {
      const salary = parseEther("1");
      await expect(
        school.pay_salary(addr2.address, { value: salary + 1n })
      ).to.be.revertedWithCustomError(school, "EXCEEDS_SALARY");
    });

    it("should revert if paying zero", async function () {
      await expect(
        school.pay_salary(addr2.address, { value: 0 })
      ).to.be.revertedWithCustomError(school, "EXCEEDS_SALARY");
    });

    it("should revert if paying to non-employee", async function () {
      await expect(
        school.pay_salary(addr3.address, { value: 1 })
      ).to.be.revertedWithCustomError(school, "NOT_EMPLOYED");
    });
  });
});
