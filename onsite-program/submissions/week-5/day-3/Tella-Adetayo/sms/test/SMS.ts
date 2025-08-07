import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SMS", function() {
  async function SMSDeploy() {
    const [owner, addr1] = await hre.ethers.getSigners(); 

    const SMS = await hre.ethers.getContractFactory("SMS"); 
    const sms = await SMS.deploy(owner); 

    return { sms, owner, addr1 };
  }

  describe("Create Student Info", function() {
    it("Should create a student", async function() {
      const { sms, owner, addr1 } = await loadFixture(SMSDeploy); 

      const name = "Fave"; 
      const age = 28; 
      const gender = "Female"; 
      const status = 0; 

      await sms.connect(owner).createStudentInfo(addr1.address, name, age, gender); 

      const getAllStudents = await sms.connect(owner).getAllStudentInfo(addr1.address)
      const getSingleStudent = getAllStudents[0]; 

      expect(getSingleStudent[0]).to.equal(1); 
      expect(getSingleStudent[1]).to.equal(name); 
      expect(getSingleStudent[2]).to.equal(age); 
      expect(getSingleStudent[3]).to.equal(gender);
      expect(getSingleStudent[4]).to.equal(status);
    })
  })

  describe("Update student info", function() {
    it("Should update the student info", async function() {
      const { sms, owner, addr1 } = await loadFixture(SMSDeploy); 

      const name = "Fave"; 
      const age = 28; 
      const gender = "Female"; 

      await sms.connect(owner).createStudentInfo(addr1.address, name, age, gender); 

      await sms.connect(owner).updateStudentInfo(addr1.address, 0, "Olamide", 43); 

      const student = await sms.connect(owner).getSingleStudentInfo(addr1.address, 0); 

      expect(student[1]).to.equal("Olamide"); 
      expect(student[2]).to.equal(43); 
    })
  })
  describe("Update Student Status", function() {
    it("Should update the status of student", async function() {

      const { sms, owner, addr1 } = await loadFixture(SMSDeploy); 

      const name = "Fave"; 
      const age = 28; 
      const gender = "Female"; 

      await sms.connect(owner).createStudentInfo(addr1.address, name, age, gender); 
      await sms.connect(owner).updateStudentStatus(addr1.address, 0, 1);
      
      const [,,,,status] = await sms.connect(owner).getSingleStudentInfo(addr1.address, 0); 
      
      expect(status).to.equal(1); 
    })
    it("Should reject if the index is out of range", async function() {
      const { sms, owner, addr1 } = await loadFixture(SMSDeploy); 

      const name = "Fave"; 
      const age = 28; 
      const gender = "Female"; 

      await sms.connect(owner).createStudentInfo(addr1.address, name, age, gender); 

      expect(
        sms.connect(owner).updateStudentStatus(addr1.address, 3, 1)
      ).to.be.revertedWithCustomError(sms, "INDEX_OUT_OF_RANGE")
    })
  })

  describe("Delete Student Info", function() {
    it("Should delete a student info", async function() {
      const { sms, owner, addr1 } = await loadFixture(SMSDeploy); 

      const name = "Fave"; 
      const age = 28; 
      const gender = "Female"; 

      await sms.connect(owner).createStudentInfo(addr1.address, name, age, gender); 

      await sms.connect(owner).deleteStudentInfo(addr1.address, 0); 

      const student = await sms.connect(owner).getAllStudentInfo(addr1.address); 

      expect(student.length).to.equal(0);
    })
  })
})