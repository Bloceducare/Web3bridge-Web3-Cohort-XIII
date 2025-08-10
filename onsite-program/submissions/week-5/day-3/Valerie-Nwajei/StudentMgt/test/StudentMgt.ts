import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("StudentMgt", function () {
  async function deployStudentMgtFixture() {
    
    const [owner, user1, user2] = await hre.ethers.getSigners();

    const StudentMgt = await hre.ethers.getContractFactory("StudentMgt");
    const mgt = await StudentMgt.deploy();


    return { mgt, owner, user1, user2};
  }
  describe("Register", function(){
    it("should register a student", async function(){
      const { mgt } = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect((await mgt.getStudents())[0].firstName).to.equal("Jasmine");
      expect((await mgt.getStudents())[0].lastName).to.equal("Wells");
      expect((await mgt.getStudents())[0].department).to.equal("Accounting");
      expect((await mgt.getStudents())[0].studentId).to.equal(1);
      expect((await mgt.getStudents())[0].age).to.equal(12);
      expect((await mgt.getStudents())[0].status).to.equal(0);
      expect((await mgt.getStudents())[0].exists).to.be.true;
    });
    it("Should increment next student ID", async ()=>{
      const{mgt} = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect( await mgt.nextStudentId()).to.equal(2);
      await mgt.register("Charles", "Sullivan", "Pharmacy", 15);
      expect(await mgt.nextStudentId()).to.equal(3);
    });
    it("should update the array", async()=>{
      const {mgt} = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect(await mgt.getStudentCount()).to.equal(1);
    });
  });
  describe("Update Students", ()=>{
    it("should update student records", async()=>{
      const{mgt} =await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect((await mgt.getStudents())[0].lastName).to.equal("Wells");
      await mgt.updateDetails(0, "Jasmine", "Colleen", "Accounting", 12);
      expect((await mgt.getStudents())[0].lastName).to.equal("Colleen");
    });
    it("should fail if student index doesn't exist", async()=>{
      const{mgt} =await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect(await mgt.getStudentCount()).to.equal(1);
      await mgt.register("Casper", "Steve", "Medicine", 16);
      expect(await mgt.getStudentCount()).to.equal(2);
      await expect(mgt.updateDetails(7, "Casper", "Holand", "Medicine", 19)).to.be.revertedWith("No Records Found");
    });
  });
  describe("Change Status", ()=>{
    it("Should change student status", async()=>{
      const {mgt} = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      expect((await mgt.getStudents())[0].status).to.equal(0);
      await mgt.changeStatus(0, 2);
      expect((await mgt.getStudents())[0].status).to.equal(2);
    });
  });
  describe("Delete Student", ()=>{
    it("should delete a student", async()=>{
      const{mgt} = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      await mgt.register("Casper", "Steve", "Medicine", 16);
      await mgt.register("Jamie", "George", "Agriculture", 19);
      expect(await mgt.getStudentCount()).to.equal(3)
      await mgt.deleteStudent(2);
      expect(await mgt.getStudentCount()).to.equal(2)
    });
    it("should fail if student is already deleted", async()=>{
      const {mgt } = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      await mgt.register("Casper", "Steve", "Medicine", 16);
      await mgt.register("Jamie", "George", "Agriculture", 19);
      expect(await mgt.getStudentCount()).to.equal(3);
      await mgt.deleteStudent(2);
      expect(await mgt.getStudentCount()).to.equal(2);
      await expect(mgt.deleteStudent(2)).to.be.revertedWith("No Records Found");
    });
  });
  describe("getStudents", ()=>{
    it("Should get student details", async ()=>{
      const {mgt } = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      await mgt.register("Casper", "Steve", "Medicine", 16);
      await mgt.register("Jamie", "George", "Agriculture", 19);
      const studentFile = await mgt.getStudents();
      console.log(studentFile[0]);
      console.log(studentFile[1]);
      console.log(studentFile[2]);
    });
    it("should get students by id", async()=>{
       const {mgt } = await loadFixture(deployStudentMgtFixture);
      await mgt.register("Jasmine", "Wells", "Accounting", 12);
      await mgt.register("Casper", "Steve", "Medicine", 16);
      await mgt.register("Jamie", "George", "Agriculture", 19);
      const students_ = await mgt.getStudents()
      expect(await mgt.getStudentById(2)).to.deep.equal(students_[1]);
    })
  });


})