import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import {ethers} from "hardhat"
import hre from "hardhat";
import { EmployeeManagementSystem__factory } from "../typechain-types";

describe("EmployeeManagement",function(){
  async function deployEmployeeManagementSystem(){
  const [owner,otherAccount] = await hre.ethers.getSigners()
  const EmployeeManagementSystem = await hre.ethers.getContractFactory("EmployeeManagementSystem");
  const employeeManagementSystem = await EmployeeManagementSystem.deploy();
  return {employeeManagementSystem,owner,otherAccount};
}

describe("EmployeeManagementSystem", function () {
  describe("Register Employee", function () {
    it("Should register employee successfully", async function () {
      const { employeeManagementSystem, owner } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 0;

  
      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);

      const employee =  await employeeManagementSystem.getEmployee(address);
      console.log("Employee data:", employee);

      expect(employee.name).to.equal(name);
  
    });

    it("Should revert if employee has already been employed",async function(){
      const { employeeManagementSystem, owner } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 1;
      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);

      await expect(employeeManagementSystem.registerEmployee(address, name, age, salary, role)).to.be.revertedWith("Employee is already Employed");

    })

  });

  describe("Pay Employee Salary",function(){
    it("Should pay employee salary if employee is an admin",async function(){
    
          const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);


          await owner.sendTransaction({
          to: employeeManagementSystem.target,
          value: ethers.parseEther("3.0"),
        });

            const address = owner.address;
            const name = "Daniel";
            const age = 25;
            const salary = ethers.parseEther("2");
            const role = 2;

            await employeeManagementSystem.registerEmployee(address, name, age, salary, role);
            await employeeManagementSystem.registerEmployee(otherAccount.address,name,age,salary,1);
            const amount = ethers.parseEther("2");

            const admin =  await employeeManagementSystem.getEmployee(address);
            const employee =  await employeeManagementSystem.getEmployee(otherAccount.address);
            

            expect(admin.status).to.equal(1);
            expect(employee.status).to.equal(1);
            expect(admin.role).to.equal(2);
            expect(employee.role).to.equal(1);

        

            const balanceBeforePay = await ethers.provider.getBalance(otherAccount.address);

            await employeeManagementSystem.payEmployeeSalary(otherAccount.address,amount);

            const balanceAfterPay = await ethers.provider.getBalance(otherAccount.address);

            expect(balanceAfterPay).to.above(balanceBeforePay);

        })

        })
})

      it("Should not pay employee if the sender is not an admin",async function(){
      const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 1;

      await employeeManagementSystem.registerEmployee(address, name, age, salary, role);
      await employeeManagementSystem.registerEmployee(otherAccount.address,name,age,salary,1);
      const amount = ethers.parseEther("2");
      await expect(employeeManagementSystem.connect(otherAccount).payEmployeeSalary(address,amount)).to.be.revertedWith("You are not an Admin");

})
  it("Should not pay employee if the employee is not employed",async function(){
  const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);
      const address = owner.address;
      const name = "Daniel";
      const age = 25;
      const salary = ethers.parseEther("2");
      const role = 0;

      await employeeManagementSystem.registerEmployee(otherAccount.address,name,age,salary,2);
      const amount = ethers.parseEther("2");
      await expect(employeeManagementSystem.connect(otherAccount).payEmployeeSalary(address,amount)).to.be.revertedWith("Employee is not Employed");

})



describe("Get Employee By Address",async function(){
const { employeeManagementSystem, owner,otherAccount } = await loadFixture(deployEmployeeManagementSystem);
 const address = owner.address;
 const name = "Daniel";
 const age = 25;
 const salary = ethers.parseEther("2");
 const role = 0;
 await employeeManagementSystem.registerEmployee(address, name, age, salary, role);
 const employee =  await employeeManagementSystem.getEmployee(address);
 console.log("Employee data:", employee);

 expect(employee.name).to.equal(name);
 



})

});