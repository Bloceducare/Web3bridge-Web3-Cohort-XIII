import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers }from "hardhat";


describe("SMS Deploy", function() {
  async function deployStudentMgtSystem() {
    const [owner, addr1] = await ethers.getSigners(); 

    const StudentMgtSystem = await hre.ethers.getContractFactory("SMS"); 
    const studentMgtSystem = await StudentMgtSystem.deploy(owner.address); 

    

    return { studentMgtSystem, owner, addr1 }
  }

  describe("createStudentInfo", function() {
    it("Should create a student", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 
      const _status = 0;

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      const student = await studentMgtSystem.connect(owner).getSingleStudentInfo(addr1.address, 0); 
      expect(student[0]).to.equal(1); 
      expect(student[1]).to.equal(_name); 
      expect(student[2]).to.equal(_age); 
      expect(student[3]).to.equal(_gender);
      expect(student[4]).to.equal(_status);
    })
  })

  describe("updateStudentInfo", function() {
    it("should update a student info", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      await studentMgtSystem.connect(owner).updateStudentInfo(addr1.address, 0, "Ayra Starr",24); 

      const student = await studentMgtSystem.connect(owner).getSingleStudentInfo(addr1.address, 0); 
      expect(student[0]).to.equal(1); 
      expect(student[1]).to.equal("Ayra Starr"); 
      expect(student[2]).to.equal(24);

    })
  })
  describe("updateStudentStatus", function() {
    it("should update the status of student", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      await studentMgtSystem.connect(owner).updateStudentStatus(addr1.address, 0, 1); 

       const [, name, age, gender, status] = await studentMgtSystem.connect(owner).getSingleStudentInfo(addr1.address, 0);
      

      expect(status).to.equal(1);
    })
    it("Should revert if index is out of range", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      await expect(
        studentMgtSystem.connect(owner).updateStudentStatus(addr1.address, 100, 1)
      ).to.be.revertedWithCustomError(studentMgtSystem, "INDEX_OUT_OF_RANGE"); 
    })
  })

  describe("deleteStudentInfo", function() {
    it("should delete student info", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      await studentMgtSystem.deleteStudentInfo(addr1, 0)

      const getStudent = await studentMgtSystem.getAllStudentInfo(addr1.address); 

      expect(getStudent.length).to.equal(0); 
    })
  })
  describe("getSingleStudentInfo", function() {
    it("should get each details of the students", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender); 

      const [id, name, age, gender, status]= await studentMgtSystem.connect(owner).getSingleStudentInfo(addr1.address, 0);
      
      expect(id).to.equal(1);
      expect(name).to.equal(_name); 
      expect(age).to.equal(_age); 
      expect(gender).to.equal(_gender); 
      expect(status).to.equal(0);
    })
    it("should revert if the length is out of range", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender);

      await expect(
        studentMgtSystem.connect(owner).getSingleStudentInfo(addr1.address, 11)
      ).to.be.revertedWithCustomError(studentMgtSystem, "INDEX_OUT_OF_RANGE"); 
    })
  })

  describe("getAllStudentInfo", function() {
    it("should get all the students", async function() {
      const { studentMgtSystem, owner, addr1 } = await loadFixture(deployStudentMgtSystem); 

      const _name = "Wizkid"; 
      const _age = 35; 
      const _gender = "Male"; 

      await studentMgtSystem.connect(owner).createStudentInfo(addr1.address, _name, _age, _gender);

      const student = await studentMgtSystem.getAllStudentInfo(addr1.address); 

      expect(student[0][0]).to.equal(1); 
      expect(student[0][1]).to.equal(_name); 
      expect(student[0][2]).to.equal(_age); 
      expect(student[0][3]).to.equal(_gender); 
      expect(student[0][4]).to.equal(0);
    })
  })
})