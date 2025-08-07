import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Employee Access Deploy", function() {
    async function employeeAccessDeploy() {
        const Employee = await hre.ethers.getContractFactory("Employee");
        const employee = await Employee.deploy(); 

        const [owner, addr1] = await hre.ethers.getSigners(); 
        return { employee, owner, addr1 }; 
    }

    describe("register user", function() {
        it("Should register a user", async function() {
            const { employee, owner, addr1 } = await loadFixture(employeeAccessDeploy); 

            const name = "Bayo"; 
            const role = 2; 
            const salary = 150000; 

            await employee.connect(addr1).registerUser(name, role, salary); 

            const getUser = await employee.connect(owner).getUser(addr1); 
            expect(getUser[0]).to.equal(name); 
            expect(getUser[1]).to.equal(true);
            expect(getUser[2]).to.equal(2); 
            expect(getUser[3]).to.equal(salary);
            expect(getUser[4]).to.equal(0);
        })
    })

    describe("Update user", function() {
        it("Should update the user", async function() {
            const { employee, owner, addr1 } = await loadFixture(employeeAccessDeploy); 

            const name = "Bayo"; 
            const role = 2; 
            const salary = 150000; 

            await employee.connect(addr1).registerUser(name, role, salary); 

            await employee.connect(owner).updateUser("Fave", 0, false, 2000000); 

            const getUser = await employee.connect(owner).getUser(owner); 
            expect(getUser[0]).to.equal("Fave"); 
            expect(getUser[1]).to.equal(false);
            expect(getUser[2]).to.equal(0); 
            expect(getUser[3]).to.equal(2000000);
        })
    })

    describe("Get all user", function() {
        it("Should get all users", async function() {
            const { employee, owner, addr1 } = await loadFixture(employeeAccessDeploy); 
            const name = "Bayo"; 
            const role = 2; 
            const salary = 150000; 

            await employee.connect(owner).registerUser(name, role, salary); 

            const getUser = await employee.connect(owner).getUser(owner); 
            expect(getUser[0]).to.equal(name); 
            expect(getUser[1]).to.equal(true);
            expect(getUser[2]).to.equal(2); 
            expect(getUser[3]).to.equal(salary);
            expect(getUser[4]).to.equal(0);


        })
    })

    describe("Disburse Salary", function() {
        it("Should disburse salary", async function() {
            const { employee, owner, addr1 } = await loadFixture(employeeAccessDeploy); 

            const amount = hre.ethers.parseEther("100");

            const name = "Bayo"; 
            const role = 2; 
            const salary = hre.ethers.parseEther("1000"); 

            await employee.connect(addr1).registerUser(name, role, salary); 

            await employee.connect(owner).disburseSalary(addr1, amount); 

            const getUser = await employee.connect(owner).getUser(addr1); 
            expect(getUser[4]).equal(amount); 

            await expect(
                employee.connect(owner).getUser(addr1)
            ).to.emit(employee, "disburseSalary").withArgs(addr1, amount);
        })
    })

    describe("Remaining Salary", function() {
        it("Should show the remaining salary", async function() {
            const { employee, owner, addr1 } = await loadFixture(employeeAccessDeploy);

            const amount = hre.ethers.parseEther("100");

            const name = "Bayo"; 
            const role = 2; 
            const salary = hre.ethers.parseEther("1000");

            await employee.connect(addr1).registerUser(name, role, salary); 

            const getUser = await employee.connect(owner).getUser(addr1); 
            expect(getUser[4]).equal(amount);

            const remainSalary = await employee.connect(owner).remainingSalary(addr1)

            expect(remainSalary).to.equal(salary - getUser[4]); 

        })
    })
})