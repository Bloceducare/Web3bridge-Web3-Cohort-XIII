import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { SchoolManagementSystem } from "../typechain-types";

describe("SchoolManagementSystem", function () {
    let schoolManagementSystem: SchoolManagementSystem;
    let owner: Signer;
    let student1: Signer;
    let student2: Signer;
    let nonOwner: Signer;

    beforeEach(async function () {
        [owner, student1, student2, nonOwner] = await ethers.getSigners();

        const SchoolManagementSystemFactory = await ethers.getContractFactory("SchoolManagementSystem");
        schoolManagementSystem = await SchoolManagementSystemFactory.deploy();
        await schoolManagementSystem.waitForDeployment();

        await schoolManagementSystem.register_student(await student1.getAddress(), "Alice", "Mathemtics", 20);
    });

    describe("Student Registration", function () {
        it("Should deploy the SchoolManagementSystem contract", async function () {
            expect(schoolManagementSystem).to.exist;
        });

        it("Should register a student", async function () {
            const studentAddress = await student1.getAddress();
            const student = await schoolManagementSystem.get_student_by_address(studentAddress);

            expect(student.name).to.equal("Alice");
            expect(student.course).to.equal("Mathemtics");
            expect(student.age).to.equal(20);
        });

        it("Should register the second student", async function () {
            const studentAddress = await student2.getAddress();
            await schoolManagementSystem.register_student(studentAddress, "Bob", "Physics", 22);

            const student = await schoolManagementSystem.get_student_by_address(studentAddress);
            expect(student.name).to.equal("Bob");
            expect(student.course).to.equal("Physics");
            expect(student.age).to.equal(22);
        });

        it("Should fail while registering a student without a name", async function () {
            await expect(
                schoolManagementSystem.register_student(await student2.getAddress(), "", "Mathematics", 21)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "INVALID_INPUT");
        });

        it("Should fail while registering a student with an invalid age", async function () {
            await expect(
                schoolManagementSystem.register_student(await student2.getAddress(), "Charlie", "Biology", 0)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "INVALID_INPUT");
        });

        it("should fail while registering a student with an invalid course", async function () {
            await expect(
                schoolManagementSystem.register_student(await student2.getAddress(), "Charlie", "", 23)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "INVALID_INPUT");
        });
    });

    describe("Student Management", function () {
        it("Should update student details", async function () {
            const studentAddress = await student1.getAddress();
            await schoolManagementSystem.update_student(studentAddress, "Alice Smith");

            const student = await schoolManagementSystem.get_student_by_address(studentAddress);
            expect(student.name).to.equal("Alice Smith");
        });

        it("Should fail to update student details with an invalid name", async function () {
            const studentAddress = await student1.getAddress();
            await expect(
                schoolManagementSystem.update_student(studentAddress, "")
            ).to.be.revertedWithCustomError(schoolManagementSystem, "INVALID_INPUT");
        });

        it("Should fail to update non-existent student", async function () {
            const nonExistentAddress = "0x0000000000000000000000000000000000000000";
            await expect(
                schoolManagementSystem.update_student(nonExistentAddress, "NonExistent")
            ).to.be.revertedWithCustomError(schoolManagementSystem, "STUDENT_NOT_FOUND");
        });

        it("Should allow owner to delete a student", async function () {
            const studentAddress = await student1.getAddress();
            await schoolManagementSystem.delete_student(studentAddress);

            await expect(schoolManagementSystem.get_student_by_address(studentAddress))
                .to.be.revertedWithCustomError(schoolManagementSystem, "STUDENT_NOT_FOUND");
        });

        it("Should fail to delete a student by non-owner", async function () {
            const studentAddress = await student1.getAddress();
            await expect(
                schoolManagementSystem.connect(nonOwner).delete_student(studentAddress)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "UNAUTHORIZED_ACCESS");
        });

        it("Should revert when trying to delete a non-existent student", async function () {
            const nonExistentAddress = "0x0000000000000000000000000000000000000000";
            await expect(
                schoolManagementSystem.delete_student(nonExistentAddress)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "STUDENT_NOT_FOUND");
        });
    });
    describe("Get all students", function () {
        it("Should return all registered students", async function () {
            const studentAddress1 = await student1.getAddress();
            const studentAddress2 = await student2.getAddress();

            await schoolManagementSystem.register_student(studentAddress2, "Bob", "Physics", 22);

            const students = await schoolManagementSystem.get_all_students();
            expect(students.length).to.equal(2);
            expect(students[0].name).to.equal("Alice");
            expect(students[1].name).to.equal("Bob");
        });

        it("Should return an empty array if no students are registered", async function () {
            const newSchoolManagementSystem = await ethers.getContractFactory("SchoolManagementSystem");
            const emptySchoolManagementSystem = await newSchoolManagementSystem.deploy();
            await emptySchoolManagementSystem.waitForDeployment();

            const students = await emptySchoolManagementSystem.get_all_students();
            expect(students.length).to.equal(0);
        });

        it("Should get all students after multiple registrations", async function () {
            const studentAddress1 = await student1.getAddress();
            const studentAddress2 = await student2.getAddress();

            await schoolManagementSystem.register_student(studentAddress2, "Bob", "Physics", 22);
            // await schoolManagementSystem.register_student(await ethers.getSigners().getAddress(), "Charlie", "Chemistry", 23);

            const students = await schoolManagementSystem.get_all_students();
            expect(students.length).to.equal(2);
            expect(students[0].name).to.equal("Alice");
            expect(students[1].name).to.equal("Bob");
        });
    });

    describe("Unauthorized Access", function () {
        it("Should revert when non-owner tries to update a student", async function () {
            const studentAddress = await student1.getAddress();
            await expect(
                schoolManagementSystem.connect(nonOwner).update_student(studentAddress, "Eve")
            ).to.be.revertedWithCustomError(schoolManagementSystem, "UNAUTHORIZED_ACCESS");
        });

        it("Should revert when non-owner tries to delete a student", async function () {
            const studentAddress = await student1.getAddress();
            await expect(
                schoolManagementSystem.connect(nonOwner).delete_student(studentAddress)
            ).to.be.revertedWithCustomError(schoolManagementSystem, "UNAUTHORIZED_ACCESS");
        });
    });
});