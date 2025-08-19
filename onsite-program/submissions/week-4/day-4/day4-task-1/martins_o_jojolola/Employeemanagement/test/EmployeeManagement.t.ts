import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { EmployeeManagement } from "../typechain-types";

describe("EmployeeManagement", function () {
    let employeeManagement: EmployeeManagement;
    let owner: Signer;
    let addr1: Signer;
    let addr2: Signer;
    let addr3: Signer;
    let addrs: Signer[];

    // Employee roles enum mapping
    const ROLES = {
        MEDIA_TEAM: 0,
        MENTORS: 1,
        MANAGERS: 2,
        SOCIAL_MEDIA: 3,
        TECHNICAL_SUPERVISORS: 4,
        KITCHEN_STAFF: 5
    };

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

        const EmployeeManagementFactory = await ethers.getContractFactory("EmployeeManagement");
        employeeManagement = await EmployeeManagementFactory.deploy();
        await employeeManagement.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(await employeeManagement.getAddress()).to.be.properAddress;
        });

        it("Should have no employees initially", async function () {
            const allEmployees = await employeeManagement.getAllEmployees();
            expect(allEmployees.length).to.equal(0);
        });
    });

    describe("Adding Employees", function () {
        it("Should add a new employee successfully", async function () {
            const employeeAddr = await addr1.getAddress();
            const name = "John Doe";
            const role = ROLES.MEDIA_TEAM;
            const email = "john@example.com";

            await employeeManagement.addEmployee(employeeAddr, name, role, email);

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.name).to.equal(name);
            expect(employee.role).to.equal(role);
            expect(employee.email).to.equal(email);
            expect(employee.isEmployee).to.be.true;
        });

        it("Should add employee address to the array", async function () {
            const employeeAddr = await addr1.getAddress();

            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            const storedAddress = await employeeManagement.employeeAddresses(0);
            expect(storedAddress).to.equal(employeeAddr);
        });

        it("Should add multiple employees", async function () {
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();

            await employeeManagement.addEmployee(
                addr1Address,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            await employeeManagement.addEmployee(
                addr2Address,
                "Jane Smith",
                ROLES.MANAGERS,
                "jane@example.com"
            );

            const allEmployees = await employeeManagement.getAllEmployees();
            expect(allEmployees.length).to.equal(2);
            expect(allEmployees[0].name).to.equal("John Doe");
            expect(allEmployees[1].name).to.equal("Jane Smith");
        });

        it("Should revert when adding employee with empty name", async function () {
            const employeeAddr = await addr1.getAddress();

            await expect(
                employeeManagement.addEmployee(employeeAddr, "", ROLES.MEDIA_TEAM, "test@example.com")
            ).to.be.revertedWithCustomError(employeeManagement, "EmptyEmployeeName")
                .withArgs("Employee name cannot be empty");
        });

        it("Should revert when adding employee with zero address", async function () {
            await expect(
                employeeManagement.addEmployee(
                    ethers.ZeroAddress,
                    "John Doe",
                    ROLES.MEDIA_TEAM,
                    "test@example.com"
                )
            ).to.be.revertedWithCustomError(employeeManagement, "InvalidEmployeeAddress")
                .withArgs("Employee address cannot be zero");
        });

        it("Should allow adding employee with same address (overwrite)", async function () {
            const employeeAddr = await addr1.getAddress();

            // Add first employee
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            // Add employee with same address (should overwrite)
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Smith",
                ROLES.MANAGERS,
                "johnsmith@example.com"
            );

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.name).to.equal("John Smith");
            expect(employee.role).to.equal(ROLES.MANAGERS);
            expect(employee.email).to.equal("johnsmith@example.com");
        });
    });

    describe("Updating Employees", function () {
        beforeEach(async function () {
            const employeeAddr = await addr1.getAddress();
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );
        });

        it("Should update existing employee successfully", async function () {
            const employeeAddr = await addr1.getAddress();
            const newName = "John Smith";
            const newRole = ROLES.MANAGERS;
            const newEmail = "johnsmith@example.com";

            await employeeManagement.updateEmployee(employeeAddr, newName, newRole, newEmail);

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.name).to.equal(newName);
            expect(employee.role).to.equal(newRole);
            expect(employee.email).to.equal(newEmail);
            expect(employee.isEmployee).to.be.true;
        });

        it("Should revert when updating non-existent employee", async function () {
            const nonExistentAddr = await addr2.getAddress();

            await expect(
                employeeManagement.updateEmployee(
                    nonExistentAddr,
                    "Jane Doe",
                    ROLES.MANAGERS,
                    "jane@example.com"
                )
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound")
                .withArgs("Employee not found");
        });

        it("Should revert when updating with empty name", async function () {
            const employeeAddr = await addr1.getAddress();

            await expect(
                employeeManagement.updateEmployee(employeeAddr, "", ROLES.MANAGERS, "test@example.com")
            ).to.be.revertedWithCustomError(employeeManagement, "EmptyEmployeeName")
                .withArgs("Employee name cannot be empty");
        });
    });

    describe("Garage Access Control", function () {
        const rolesWithAccess = [ROLES.MEDIA_TEAM, ROLES.MENTORS, ROLES.MANAGERS];
        const rolesWithoutAccess = [ROLES.SOCIAL_MEDIA, ROLES.TECHNICAL_SUPERVISORS, ROLES.KITCHEN_STAFF];

        rolesWithAccess.forEach((role, index) => {
            it(`Should grant garage access to ${Object.keys(ROLES)[role]} role`, async function () {
                const employeeAddr = await addrs[index].getAddress();

                await employeeManagement.addEmployee(
                    employeeAddr,
                    `Employee ${index}`,
                    role,
                    `employee${index}@example.com`
                );

                const hasAccess = await employeeManagement.canAccessGarage(employeeAddr);
                expect(hasAccess).to.be.true;
            });
        });

        rolesWithoutAccess.forEach((role, index) => {
            it(`Should deny garage access to ${Object.keys(ROLES)[role]} role`, async function () {
                const employeeAddr = await addrs[index].getAddress();

                await employeeManagement.addEmployee(
                    employeeAddr,
                    `Employee ${index}`,
                    role,
                    `employee${index}@example.com`
                );

                const hasAccess = await employeeManagement.canAccessGarage(employeeAddr);
                expect(hasAccess).to.be.false;
            });
        });

        it("Should revert when checking garage access for non-existent employee", async function () {
            const nonExistentAddr = await addr2.getAddress();

            await expect(
                employeeManagement.canAccessGarage(nonExistentAddr)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound")
                .withArgs("Employee not found");
        });
    });

    describe("Getting Employee Details", function () {
        beforeEach(async function () {
            const employeeAddr = await addr1.getAddress();
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );
        });

        it("Should return correct employee details", async function () {
            const employeeAddr = await addr1.getAddress();

            const [name, role, isEmployed, hasGarageAccess] = await employeeManagement.getEmployeeDetails(employeeAddr);

            expect(name).to.equal("John Doe");
            expect(role).to.equal(ROLES.MEDIA_TEAM);
            expect(isEmployed).to.be.true;
            expect(hasGarageAccess).to.be.true;
        });

        it("Should return correct garage access status based on role", async function () {
            const addr2Address = await addr2.getAddress();

            // Add employee with role that doesn't have garage access
            await employeeManagement.addEmployee(
                addr2Address,
                "Jane Smith",
                ROLES.KITCHEN_STAFF,
                "jane@example.com"
            );

            const [, , , hasGarageAccess] = await employeeManagement.getEmployeeDetails(addr2Address);
            expect(hasGarageAccess).to.be.false;
        });

        it("Should revert when getting details for non-existent employee", async function () {
            const nonExistentAddr = await addr2.getAddress();

            await expect(
                employeeManagement.getEmployeeDetails(nonExistentAddr)
            ).to.be.revertedWithCustomError(employeeManagement, "EmployeeNotFound")
                .withArgs("Employee not found");
        });
    });

    describe("Getting All Employees", function () {
        it("Should return empty array when no employees exist", async function () {
            const allEmployees = await employeeManagement.getAllEmployees();
            expect(allEmployees.length).to.equal(0);
        });

        it("Should return all employees correctly", async function () {
            const addr1Address = await addr1.getAddress();
            const addr2Address = await addr2.getAddress();
            const addr3Address = await addr3.getAddress();

            // Add multiple employees
            await employeeManagement.addEmployee(
                addr1Address,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            await employeeManagement.addEmployee(
                addr2Address,
                "Jane Smith",
                ROLES.MANAGERS,
                "jane@example.com"
            );

            await employeeManagement.addEmployee(
                addr3Address,
                "Bob Johnson",
                ROLES.KITCHEN_STAFF,
                "bob@example.com"
            );

            const allEmployees = await employeeManagement.getAllEmployees();

            expect(allEmployees.length).to.equal(3);
            expect(allEmployees[0].name).to.equal("John Doe");
            expect(allEmployees[0].role).to.equal(ROLES.MEDIA_TEAM);
            expect(allEmployees[1].name).to.equal("Jane Smith");
            expect(allEmployees[1].role).to.equal(ROLES.MANAGERS);
            expect(allEmployees[2].name).to.equal("Bob Johnson");
            expect(allEmployees[2].role).to.equal(ROLES.KITCHEN_STAFF);
        });

        it("Should maintain correct order of employees", async function () {
            const addresses = await Promise.all([addr1, addr2, addr3].map(signer => signer.getAddress()));
            const names = ["First Employee", "Second Employee", "Third Employee"];

            // Add employees in specific order
            for (let i = 0; i < 3; i++) {
                await employeeManagement.addEmployee(
                    addresses[i],
                    names[i],
                    ROLES.MEDIA_TEAM,
                    `employee${i}@example.com`
                );
            }

            const allEmployees = await employeeManagement.getAllEmployees();

            for (let i = 0; i < 3; i++) {
                expect(allEmployees[i].name).to.equal(names[i]);
            }
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle very long names", async function () {
            const longName = "a".repeat(1000); // Very long name
            const employeeAddr = await addr1.getAddress();

            await employeeManagement.addEmployee(
                employeeAddr,
                longName,
                ROLES.MEDIA_TEAM,
                "test@example.com"
            );

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.name).to.equal(longName);
        });

        it("Should handle very long emails", async function () {
            const longEmail = "a".repeat(500) + "@example.com";
            const employeeAddr = await addr1.getAddress();

            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                longEmail
            );

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.email).to.equal(longEmail);
        });

        it("Should handle special characters in names and emails", async function () {
            const specialName = "José María O'Connor-Smith";
            const specialEmail = "jose.maria+test@example-domain.co.uk";
            const employeeAddr = await addr1.getAddress();

            await employeeManagement.addEmployee(
                employeeAddr,
                specialName,
                ROLES.MEDIA_TEAM,
                specialEmail
            );

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.name).to.equal(specialName);
            expect(employee.email).to.equal(specialEmail);
        });

        it("Should handle maximum enum value", async function () {
            const employeeAddr = await addr1.getAddress();

            await employeeManagement.addEmployee(
                employeeAddr,
                "Kitchen Staff",
                ROLES.KITCHEN_STAFF, // Last enum value
                "kitchen@example.com"
            );

            const employee = await employeeManagement.employees(employeeAddr);
            expect(employee.role).to.equal(ROLES.KITCHEN_STAFF);
        });
    });

    describe("Gas Optimization Tests", function () {
        it("Should track gas usage for adding employees", async function () {
            const employeeAddr = await addr1.getAddress();

            const tx = await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            const receipt = await tx.wait();
            console.log(`Gas used for adding employee: ${receipt?.gasUsed}`);

            // Ensure gas usage is reasonable (adjust threshold as needed)
            expect(receipt?.gasUsed).to.be.lessThan(200000);
        });

        it("Should track gas usage for updating employees", async function () {
            const employeeAddr = await addr1.getAddress();

            // First add an employee
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.MEDIA_TEAM,
                "john@example.com"
            );

            // Then update
            const tx = await employeeManagement.updateEmployee(
                employeeAddr,
                "John Smith",
                ROLES.MANAGERS,
                "johnsmith@example.com"
            );

            const receipt = await tx.wait();
            console.log(`Gas used for updating employee: ${receipt?.gasUsed}`);

            expect(receipt?.gasUsed).to.be.lessThan(100000);
        });

        it("Should track gas usage for getting all employees", async function () {
            // Add multiple employees first
            const addresses = await Promise.all([addr1, addr2, addr3].map(signer => signer.getAddress()));

            for (let i = 0; i < addresses.length; i++) {
                await employeeManagement.addEmployee(
                    addresses[i],
                    `Employee ${i}`,
                    ROLES.MEDIA_TEAM,
                    `employee${i}@example.com`
                );
            }

            const tx = await employeeManagement.getAllEmployees.staticCall();
            console.log(`Retrieved ${(tx as any).length} employees`);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete employee lifecycle", async function () {
            const employeeAddr = await addr1.getAddress();

            // Add employee
            await employeeManagement.addEmployee(
                employeeAddr,
                "John Doe",
                ROLES.KITCHEN_STAFF,
                "john@example.com"
            );

            // Check initial state
            let [name, role, isEmployed, hasGarageAccess] = await employeeManagement.getEmployeeDetails(employeeAddr);
            expect(name).to.equal("John Doe");
            expect(role).to.equal(ROLES.KITCHEN_STAFF);
            expect(isEmployed).to.be.true;
            expect(hasGarageAccess).to.be.false;

            // Update to role with garage access
            await employeeManagement.updateEmployee(
                employeeAddr,
                "John Smith",
                ROLES.MANAGERS,
                "johnsmith@example.com"
            );

            // Check updated state
            [name, role, isEmployed, hasGarageAccess] = await employeeManagement.getEmployeeDetails(employeeAddr);
            expect(name).to.equal("John Smith");
            expect(role).to.equal(ROLES.MANAGERS);
            expect(isEmployed).to.be.true;
            expect(hasGarageAccess).to.be.true;

            // Verify garage access directly
            const canAccess = await employeeManagement.canAccessGarage(employeeAddr);
            expect(canAccess).to.be.true;
        });

        it("Should handle multiple employees with different access levels", async function () {
            const addresses = await Promise.all([addr1, addr2, addr3].map(signer => signer.getAddress()));
            const roles = [ROLES.MANAGERS, ROLES.KITCHEN_STAFF, ROLES.MEDIA_TEAM];
            const expectedAccess = [true, false, true];

            // Add employees with different roles
            for (let i = 0; i < 3; i++) {
                await employeeManagement.addEmployee(
                    addresses[i],
                    `Employee ${i}`,
                    roles[i],
                    `employee${i}@example.com`
                );
            }

            // Check access for each employee
            for (let i = 0; i < 3; i++) {
                const hasAccess = await employeeManagement.canAccessGarage(addresses[i]);
                expect(hasAccess).to.equal(expectedAccess[i]);
            }

            // Verify all employees are returned correctly
            const allEmployees = await employeeManagement.getAllEmployees();
            expect(allEmployees.length).to.equal(3);
        });
    });
});