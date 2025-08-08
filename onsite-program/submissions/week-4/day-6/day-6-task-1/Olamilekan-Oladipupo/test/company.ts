import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";


describe ("Company", function(){
    async function deployCompany(){
        const [owner, employeeA, employeeB, employeeC] = await hre.ethers.getSigners();

        const Web3bridge = await hre.ethers.getContractFactory("Company");
        const web3bridge = await Web3bridge.deploy(owner.address);

        return {web3bridge, owner , employeeA, employeeB, employeeC}

    }

     describe("register employee", function () {
        it("should register employee and assert employee details ", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"

            await web3bridge.connect(employeeA).createEmployee(_name);


            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);
        })

         it("should not register an existing employee", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"

            await web3bridge.connect(employeeA).createEmployee(_name);
            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

        
            await expect(web3bridge.connect(employeeA).createEmployee(_name)).to.be.revertedWithCustomError(web3bridge,"EMPLOYEE_ALREADY_EXIST");

        })

         it("should update employee status and assert employee details ", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const sacked = 2;

            await web3bridge.updateEmployeeStatus(employeeA, sacked );


            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.status).to.equal(sacked);
        }
        )


        

         it("should  set an Active employee salary and assert employee details ", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

            const _salary = 10000;

            await web3bridge.setEmployeeSalary(employeeA.address, _salary);
            const updatedEmployee = await web3bridge.getEmployee(employeeA.address);

            expect(updatedEmployee.salary).to.equal(_salary);
        })


        it("should  revert when  an employee with status PROBATION || SACKED salary is been set", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

            const sacked = 2;
            await web3bridge.updateEmployeeStatus(employeeA, sacked );
            const updatedEmployee = await web3bridge.getEmployee(employeeA.address);
            expect(updatedEmployee.status).to.equal(sacked);


            const _salary = 10000;            
            await expect(web3bridge.setEmployeeSalary(employeeA.address, _salary)).to.be.revertedWithCustomError(web3bridge,"EMPLOYEE_NOT_ACTIVE");


        })

        

        it("should  pay employee", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            await owner.sendTransaction({
            to: web3bridge.target, 
            value: ethers.parseEther("1.0"), 
        });

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

            const _salary = 10000000;

            await web3bridge.setEmployeeSalary(employeeA.address, _salary);

            const balanceBeforePay = await ethers.provider.getBalance(employeeA.address);

            await web3bridge.paySalary(employeeA.address);

            const balanceAfterPay = await ethers.provider.getBalance(employeeA.address);

            expect(balanceAfterPay).to.above(balanceBeforePay);

        })

           it("should  revert when pay employee is sacked", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

            const sacked = 2;
            await web3bridge.updateEmployeeStatus(employeeA, sacked );

            const updatedEmploye = await web3bridge.getEmployee(employeeA.address);
            expect(updatedEmploye.status).to.equal(sacked);
            await expect(web3bridge.paySalary(employeeA.address)).to.be.revertedWithCustomError(web3bridge,"EMPLOYEE_NOT_ACTIVE");

        })

          it("should  revert when pay employee status is probation", 
            async function() {
            const { web3bridge, owner, employeeA, employeeB, employeeC } = await loadFixture(deployCompany);

            const _name = "Josh"
            await web3bridge.connect(employeeA).createEmployee(_name);

            const employee = await web3bridge.getEmployee(employeeA.address);
            expect(employee.name).to.equal(_name);

            const probation = 1;
            await web3bridge.updateEmployeeStatus(employeeA, probation );

            const updatedEmploye = await web3bridge.getEmployee(employeeA.address);
            expect(updatedEmploye.status).to.equal(probation);
        })

        



        
    })
} )





