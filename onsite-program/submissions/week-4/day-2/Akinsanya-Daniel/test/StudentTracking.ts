import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import {ethers} from "hardhat";
import hre from "hardhat";


describe("Deploy Student",function(){
    async function deployStudent(){
    const Student = await ethers.getContractFactory("StudentTracking");
    const student = await Student.deploy();
    return {student};
}

describe("Register  Student",function(){
    it("It should register student successfully",async function(){
     const {student} = await loadFixture(deployStudent)
     await student.registerStudents("Daniel",25,0);
     const get_student = await student.getStudentById(0);
     expect(get_student.name).to.be.equal("Daniel")
     expect(get_student.id).to.be.equal(1);
    });

})

describe("Update Student",function(){
    it("should update student successfullly",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    await student.updateStudentNameAndAge(0,"Tomiwa",26);
    const get_student = await student.getStudentById(0);
    expect(get_student.name).to.be.equal("Tomiwa")
    expect(get_student.id).to.be.equal(1);
    })

    it("Should not update a student with invalid index",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    await expect(student.updateStudentNameAndAge(2, "Tomiwa", 27)).to.be.revertedWith("Invalid_index");

    })
})

describe("Get all student",function(){
    it("Should get all students that registered successfully",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    const get_all_students = await student.getAllStudents();
    expect(get_all_students[0].name).to.be.equal("Daniel");
    })
})

describe("Get student by index",function(){
    it("Should get a student that registered successfully",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    const get_student = await student.getStudentById(0);
    expect(await get_student.name).to.be.equal("Daniel");
 })

     it("Should not get a student with invalid index",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    await expect(student.getStudentById(2)).to.be.revertedWith("Invalid_index");

    })
})

 
  describe("Update student status",function(){
    it("Should update student status successfully",async function(){
    const {student} = await loadFixture(deployStudent);
    await student.registerStudents("Daniel",25,0);
    await student.updateStatus(0,"1");
    const get_student = await student.getStudentById(0);
    expect(await get_student.status).to.equal(1)
    })

    it("Should not update student status if the index is invalid",async function(){
      const {student} = await loadFixture(deployStudent);
      await student.registerStudents("Daniel",25,0);
      await expect(student.updateStatus(2,"1")).to.be.revertedWith("Invalid_index");

    })
  })

})





