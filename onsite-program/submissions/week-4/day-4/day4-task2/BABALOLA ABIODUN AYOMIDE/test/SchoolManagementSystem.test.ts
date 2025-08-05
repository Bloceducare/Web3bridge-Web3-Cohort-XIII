import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

enum Gender { MALE, FEMALE}

enum Status { ACTIVE, DEFERRED, RUSTICATED }

describe("School Management tests", () => { 
    async function deploySchoolContract() { 
        const [deployer, acc1, acc2, acc3] = await hre.ethers.getSigners();
        const SchoolContract = await hre.ethers.getContractFactory("SchoolManagementSystem");
        const contractDeployed = await SchoolContract.deploy();
        return { contractDeployed, deployer, acc1, acc2, acc3 };
    }
    describe("Tests deployer can register students", async () => {
        it("tests user can register students with valid data", async () => {
            const {contractDeployed} = await loadFixture(deploySchoolContract);
            const studentName = "name";
            const studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            expect((await contractDeployed.getuserSchool()).length).to.equal(1);
        })
    })
    describe("Tests student profile can be updated", async () => {
        it("tests user can register students with valid data", async () => {
            const { contractDeployed } = await loadFixture(deploySchoolContract);
            const studentName = "name";
            let studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            const userSchool = await contractDeployed.getuserSchool();
            expect(userSchool.length).to.equal(1);
            studentAge = studentAge + 19
            await contractDeployed.updateStudentAge(studentAge,userSchool[0].id);
            expect((await contractDeployed.getuserSchool())[0].age).to.equal(studentAge);
        })
    })
    describe("Tests student profile can be updated", async () => {
        it("tests user can register students with valid data", async () => {
            const {contractDeployed} = await loadFixture(deploySchoolContract);
            let studentName = "name";
            let studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            const userSchool = await contractDeployed.getuserSchool();
            expect(userSchool.length).to.equal(1);
            studentAge = studentAge + 19
            await contractDeployed.updateStudentAge(studentAge,userSchool[0].id);
            expect((await contractDeployed.getuserSchool())[0].age).to.equal(studentAge);
            expect((await contractDeployed.getuserSchool())[0].name).to.equal(studentName);
            studentName = "name ow"
            await contractDeployed["updateStudentProfile(uint256,uint256,string)"](studentAge, userSchool[0].id, studentName);
            expect((await contractDeployed.getuserSchool())[0].age).to.equal(studentAge);
            expect((await contractDeployed.getuserSchool())[0].name).to.equal(studentName);
        })
    })
     describe("suspend student", async () => {
         it("tests user can register students with valid data", async () => {
            const {contractDeployed} = await loadFixture(deploySchoolContract);
            const studentName = "name";
            let studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            let userSchool = await contractDeployed.getuserSchool();
            expect(userSchool.length).to.equal(1);
            const studentId = userSchool[0].id
            await contractDeployed.suspendStudent(studentId);
            userSchool = await contractDeployed.getuserSchool();
            expect(userSchool[0].status).to.equal(Status.DEFERRED);
            await contractDeployed.cancelStudentSuspension(studentId)
            expect((await contractDeployed.getStudentBy(studentId)).status).equal(0);
        })
     })
      describe("rusticate student", async () => {
          it("tests user can rusticate student", async () => {
            const {contractDeployed} = await loadFixture(deploySchoolContract);
            const studentName = "name";
            let studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            let userSchool = await contractDeployed.getuserSchool();
            expect(userSchool.length).to.equal(1);
            const studentId = userSchool[0].id
            await contractDeployed.rusticateStudent(studentId);
            userSchool = await contractDeployed.getuserSchool();
            expect(userSchool[0].status).to.equal(Status.RUSTICATED);
        })
      })
     describe("delete student", async () => {
         it("tests user can delete student", async () => {
            const {contractDeployed} = await loadFixture(deploySchoolContract);
            const studentName = "name";
            let studentAge = 1;
            const gender = Gender.FEMALE;
            await contractDeployed.registerStudent(studentName, studentAge, gender);
            let userSchool = await contractDeployed.getuserSchool();
            expect(userSchool.length).to.equal(1);
            const studentId = userSchool[0].id
            await contractDeployed.suspendStudent(studentId);
            userSchool = await contractDeployed.getuserSchool();
            expect(userSchool[0].status).to.equal(Status.DEFERRED);
            await contractDeployed.cancelStudentSuspension(studentId)
            expect((await contractDeployed.getStudentBy(studentId)).status).equal(0);
            await contractDeployed.deleteStudent(studentId);
            expect((await contractDeployed.getuserSchool()).length).to.equal(0)
        })
     })    
})

// TODO
//register student
// update student profile
// update student age
// suspend student
// cancel student suspension
// rusticate student
// get all students in school
// get student by id
// delete student