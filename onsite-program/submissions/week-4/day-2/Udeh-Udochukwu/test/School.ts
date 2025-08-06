import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem", function () {
  async function deploySchoolManagementFixture() {
    const [owner, student1, student2, student3] = await hre.ethers.getSigners();

    const SchoolManagementFactory = await hre.ethers.getContractFactory(
      "SchoolManagementSystem"
    );
    const school = await SchoolManagementFactory.deploy();
    await school.waitForDeployment();

    return {
      school,
      owner,
      student1,
      student2,
      student3,
    };
  }

  it("Should register a student correctly", async function () {
    const { school, student1 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );

    const student = await school.get_student_by_id(1);
    expect(student.id).to.equal(1);
    expect(student.name).to.equal("John Doe");
    expect(student.course).to.equal("Computer Science");
    expect(student.age).to.equal(20);
    expect(student.status).to.equal(0); // Status.ACTIVE
  });

  it("Should update student name correctly", async function () {
    const { school, student1 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );
    await school.update_student(1, "John Smith");

    const student = await school.get_student_by_id(1);
    expect(student.name).to.equal("John Smith");
  });

  it("Should update student status correctly", async function () {
    const { school, student1 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );
    await school.update_students_status(1, 1); // Status.DEFERRED

    const student = await school.get_student_by_id(1);
    expect(student.status).to.equal(1); // Status.DEFERRED
  });

  it("Should delete a student correctly", async function () {
    const { school, student1 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );
    await school.delete_student(1);

    await expect(school.get_student_by_id(1)).to.be.revertedWithCustomError(
      school,
      "STUDENT_NOT_FOUND"
    );
  });

  it("Should get all students correctly", async function () {
    const { school, student1, student2 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );
    await school.register_student(
      "Jane Smith",
      "Mathematics",
      19,
      student2.address
    );

    const allStudents = await school.get_all_students();
    expect(allStudents.length).to.equal(2);
    expect(allStudents[0].name).to.equal("John Doe");
    expect(allStudents[1].name).to.equal("Jane Smith");
  });

  it("Should get students by address correctly", async function () {
    const { school, student1 } = await loadFixture(
      deploySchoolManagementFixture
    );

    await school.register_student(
      "John Doe",
      "Computer Science",
      20,
      student1.address
    );
    await school.register_student(
      "John Smith",
      "Physics",
      21,
      student1.address
    );

    const studentsByAddress = await school.getStudentsByAddress(
      student1.address
    );
    expect(studentsByAddress.length).to.equal(2);
    expect(studentsByAddress[0].name).to.equal("John Doe");
    expect(studentsByAddress[1].name).to.equal("John Smith");
  });

  it("Should revert when getting non-existent student", async function () {
    const { school } = await loadFixture(deploySchoolManagementFixture);

    await expect(school.get_student_by_id(999)).to.be.revertedWithCustomError(
      school,
      "STUDENT_NOT_FOUND"
    );
  });
});
