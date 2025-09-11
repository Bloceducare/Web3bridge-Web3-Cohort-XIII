import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { EmployeeManagement } from "../typechain-types";

describe("EmployeeManagement", function () {
    let employeeManagement: EmployeeManagement;
    let owner: Signer;
    let employee1: Signer;
    let employee2: Signer;
    let employee3: Signer;
    let nonOwner: Signer;

    let ownerAddress: string;
    let employee1Address: string;
    let employee2Address: string;
    let employee3Address: string;
    let nonOwnerAddress: string;

    const SALARY_AMOUNT = ethers.parseEther("1.0");
    const TEACHER_SALARY = ethers.parseEther("1.5");

    beforeEach(async function () {
        [owner, employee1, employee2, employee3, nonOwner] = await ethers.getSigners();

        ownerAddress = await owner.getAddress();
        employee1Address = await employee1.getAddress();
        employee2Address = await employee2.getAddress();
        employee3Address = await employee3.getAddress();
        nonOwnerAddress = await nonOwner.getAddress();

        const EmployeeManagementFactory = await ethers.getContractFactory("EmployeeManagement");
        employeeManagement = await EmployeeManagementFactory.deploy();
        await employeeManagement.waitForDeployment();

        await owner.sendTransaction({
            to: await employeeManagement.getAddress(),
            value: ethers.parseEther("10.0")
        });
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await employeeManagement.getOwner()).to.equal(ownerAddress);
        });

        it("Should have the correct initial balance", async function () {
            expect(await employeeManagement.getContractBalance()).to.equal(ethers.parseEther("10.0"));
        });
    });

    describe("Employee Registration", function () {
        it("Should register an employee successfully", async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            const employee = await employeeManagement.getEmployeeDetails(employee1Address);
            expect(employee.name).to.equal("John Doe");
            expect(employee.subject).to.equal("Mathematics");
            expect(employee.salaryAmount).to.equal(SALARY_AMOUNT);
            expect(employee.status).to.equal(0);
            expect(employee.exists).to.be.true;
        });

        it("Should register a teacher successfully", async function () {
            await employeeManagement.registerEmployee(
                employee2Address,
                "Jane Smith",
                "teacher",
                TEACHER_SALARY
            );

            const employee = await employeeManagement.getEmployeeDetails(employee2Address);
            expect(employee.subject).to.equal("teacher");
            expect(employee.salaryAmount).to.equal(TEACHER_SALARY);
        });

        it("Should revert when non-owner tries to register employee", async function () {
            await expect(
                employeeManagement.connect(nonOwner).registerEmployee(
                    employee1Address,
                    "John Doe",
                    "Mathematics",
                    SALARY_AMOUNT
                )
            ).to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert when registering employee with zero salary", async function () {
            await expect(
                employeeManagement.registerEmployee(
                    employee1Address,
                    "John Doe",
                    "Mathematics",
                    0
                )
            ).to.be.revertedWithCustomError(employeeManagement, "InvalidSalaryAmount");
        });

        it("Should revert when registering duplicate employee", async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            await expect(
                employeeManagement.registerEmployee(
                    employee1Address,
                    "Jane Doe",
                    "Science",
                    SALARY_AMOUNT
                )
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeAlreadyExists");
        });
    });

    describe("Employment Status Management", function () {
        beforeEach(async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );
        });

        it("Should update employment status successfully", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 1);

            const employee = await employeeManagement.getEmployeeDetails(employee1Address);
            expect(employee.status).to.equal(1);
        });

        it("Should update status to PROBATION", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 2);

            const employee = await employeeManagement.getEmployeeDetails(employee1Address);
            expect(employee.status).to.equal(2);
        });

        it("Should revert when non-owner tries to update status", async function () {
            await expect(
                employeeManagement.connect(nonOwner).updateEmploymentStatus(employee1Address, 1)
            ).to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert when updating status of non-existent employee", async function () {
            await expect(
                employeeManagement.updateEmploymentStatus(employee2Address, 1)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
        });
    });

    describe("Salary Eligibility", function () {
        beforeEach(async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );
        });

        it("Should return true for EMPLOYED status", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 1);
            expect(await employeeManagement.isEligibleForSalary(employee1Address)).to.be.true;
        });

        it("Should return true for PROBATION status", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 2);
            expect(await employeeManagement.isEligibleForSalary(employee1Address)).to.be.true;
        });

        it("Should return false for UNEMPLOYED status", async function () {
            expect(await employeeManagement.isEligibleForSalary(employee1Address)).to.be.false;
        });

        it("Should revert when checking eligibility for non-existent employee", async function () {
            await expect(
                employeeManagement.isEligibleForSalary(employee2Address)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
        });
    });

    describe("Salary Disbursement", function () {
        beforeEach(async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );
        });

        it("Should disburse salary to eligible employee", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 1);

            const initialBalance = await ethers.provider.getBalance(employee1Address);

            await employeeManagement.disburseSalary(employee1Address);

            const finalBalance = await ethers.provider.getBalance(employee1Address);
            expect(finalBalance - initialBalance).to.equal(SALARY_AMOUNT);
        });

        it("Should disburse salary to employee on probation", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 2);

            const initialBalance = await ethers.provider.getBalance(employee1Address);

            await employeeManagement.disburseSalary(employee1Address);

            const finalBalance = await ethers.provider.getBalance(employee1Address);
            expect(finalBalance - initialBalance).to.equal(SALARY_AMOUNT);
        });

        it("Should revert when disbursing to ineligible employee (UNEMPLOYED)", async function () {
            await expect(
                employeeManagement.disburseSalary(employee1Address)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotEligible");
        });

        it("Should revert when contract has insufficient funds", async function () {
            await employeeManagement.registerEmployee(
                employee2Address,
                "High Earner",
                "CEO",
                ethers.parseEther("20.0")
            );

            await employeeManagement.updateEmploymentStatus(employee2Address, 1);

            await expect(
                employeeManagement.disburseSalary(employee2Address)
            ).to.be.revertedWithCustomError(employeeManagement, "InsufficientFunds");
        });

        it("Should revert when non-owner tries to disburse salary", async function () {
            await employeeManagement.updateEmploymentStatus(employee1Address, 1);

            await expect(
                employeeManagement.connect(nonOwner).disburseSalary(employee1Address)
            ).to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert when disbursing to non-existent employee", async function () {
            await expect(
                employeeManagement.disburseSalary(employee2Address)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
        });
    });

    describe("Employee Listing", function () {
        beforeEach(async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            await employeeManagement.registerEmployee(
                employee2Address,
                "Jane Smith",
                "teacher",
                TEACHER_SALARY
            );

            await employeeManagement.registerEmployee(
                employee3Address,
                "Bob Johnson",
                "Science",
                SALARY_AMOUNT
            );
        });

        it("Should return all employee addresses", async function () {
            const allEmployees = await employeeManagement.getAllEmployees();
            expect(allEmployees).to.deep.equal([employee1Address, employee2Address, employee3Address]);
        });

        it("Should return only teacher addresses", async function () {
            const teachers = await employeeManagement.getAllTeachers();
            expect(teachers).to.deep.equal([employee2Address]);
        });

        it("Should return empty array when no teachers exist", async function () {

            const newContract = await (await ethers.getContractFactory("EmployeeManagement")).deploy();

            await newContract.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            const teachers = await newContract.getAllTeachers();
            expect(teachers).to.deep.equal([]);
        });
    });

    describe("Contract Balance Management", function () {
        it("Should receive funds correctly", async function () {
            const initialBalance = await employeeManagement.getContractBalance();

            await owner.sendTransaction({
                to: await employeeManagement.getAddress(),
                value: ethers.parseEther("5.0")
            });

            const finalBalance = await employeeManagement.getContractBalance();
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("5.0"));
        });

        it("Should decrease balance after salary disbursement", async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            await employeeManagement.updateEmploymentStatus(employee1Address, 1);

            const initialBalance = await employeeManagement.getContractBalance();

            await employeeManagement.disburseSalary(employee1Address);

            const finalBalance = await employeeManagement.getContractBalance();
            expect(initialBalance - finalBalance).to.equal(SALARY_AMOUNT);
        });
    });

    describe("Edge Cases and Error Handling", function () {
        it("Should handle multiple salary disbursements correctly", async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                ethers.parseEther("0.5")
            );

            await employeeManagement.updateEmploymentStatus(employee1Address, 1);

            const initialBalance = await ethers.provider.getBalance(employee1Address);

            await employeeManagement.disburseSalary(employee1Address);
            await employeeManagement.disburseSalary(employee1Address);

            const finalBalance = await ethers.provider.getBalance(employee1Address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.0"));
        });

        it("Should handle getting details of existing employee", async function () {
            await employeeManagement.registerEmployee(
                employee1Address,
                "John Doe",
                "Mathematics",
                SALARY_AMOUNT
            );

            const employee = await employeeManagement.getEmployeeDetails(employee1Address);
            expect(employee.exists).to.be.true;
            expect(employee.name).to.equal("John Doe");
        });

        it("Should revert when getting details of non-existent employee", async function () {
            await expect(
                employeeManagement.getEmployeeDetails(employee1Address)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound");
        });
    });
});