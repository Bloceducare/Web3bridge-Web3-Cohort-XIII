import {
  SchoolManagementSystem,
  SchoolManagementSystem as SMS,
} from "../typechain-types";
import { ethers } from "hardhat";
import { assert, expect } from "chai";

enum Status {
  ACTIVE,
  DEFERRED,
  RUSTICATED,
}

enum Sex {
  MALE,
  FEMALE,
  OTHER,
}

describe("School Management System", async () => {
  let SMSInstance: SchoolManagementSystem;

  beforeEach("setup", async () => {
    SMSInstance = await ethers.deployContract("SchoolManagementSystem");
    await SMSInstance.waitForDeployment();
  });

  describe("Student Registration", async () => {
    it("should register a student", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // get newly registered info
      const {
        name: name_,
        telephone_number: telephone_number_,
        age: age_,
        sex: sex_,
        // status,
        exists,
      } = await SMSInstance.getStudent(jason.address);

      expect(name_).to.equal(_name);
      expect(telephone_number_).to.equal(_telephone_number);
      expect(sex_).to.equal(_sex);
      expect(exists).to.equal(true);
      expect(age_).to.equal(_age);
    });
    it("should mark a newly created student's status as ACTIVE", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // get newly registered student's status
      const { status } = await SMSInstance.getStudent(jason.address);
      console.log(status);

      expect(status).to.equal(Status.ACTIVE);
    });
    it("should revert if non-manager tries to register a student", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await expect(
        SMSInstance.connect(jason).registerStudent(
          _studentAddress,
          _name,
          _telephone_number,
          _age,
          _sex
        )
      ).to.revertedWithCustomError(SMSInstance, "School__UnAuthorized");
    });
    it("should revert if student already exists", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // try register the same student again
      await expect(
        SMSInstance.registerStudent(
          _studentAddress,
          _name,
          _telephone_number,
          _age,
          _sex
        )
      ).to.revertedWithCustomError(SMSInstance, "School__StudentAlreadyExists");
    });
    it("should emit StudentRegistered event after a successful registration", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user and listen for event
      expect(
        await SMSInstance.registerStudent(
          _studentAddress,
          _name,
          _telephone_number,
          _age,
          _sex
        )
      )
        .to.emit(SMSInstance, "StudentRegistered")
        .withArgs(jason.address, _name);
    });
  });

  describe("Change student status", async () => {
    it("should update student status successfully", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register student
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      const newStatus = Status.DEFERRED;

      // update student status
      await SMSInstance.changeStudentStatus(jason.address, newStatus);

      const { status } = await SMSInstance.getStudent(jason.address);

      expect(status).to.equal(newStatus);
    });
    it("should revert when called by non-manager", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register student
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      const newStatus = Status.DEFERRED;

      // update student status
      await expect(
        SMSInstance.connect(jason).changeStudentStatus(jason.address, newStatus)
      ).to.revertedWithCustomError(SMSInstance, "School__UnAuthorized");
    });
    it("should revert if student does not exist", async () => {
      const [owner, jason, nobody] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register student
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      const newStatus = Status.DEFERRED;

      // update student status
      await expect(
        SMSInstance.changeStudentStatus(nobody.address, newStatus)
      ).to.revertedWithCustomError(SMSInstance, "School__NotFound");
    });
    it("should emit StudentUpdated event", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register student
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      const newStatus = Status.DEFERRED;

      // update student status
      expect(await SMSInstance.changeStudentStatus(jason.address, newStatus))
        .to.emit(SMSInstance, "StudentStatusChanged")
        .withArgs(jason.address, newStatus);
    });
  });

  describe("Update student", async () => {
    it("should successfully update student info", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // updated student info
      const u_name = "Hannah";
      const u_telephone_number = "09124560984";
      const u_age = 25;
      const u_sex = Sex.FEMALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // update user
      await SMSInstance.updateStudent(
        _studentAddress,
        u_name,
        u_telephone_number,
        u_age,
        u_sex
      );

      // get updated student info
      const {
        name: u_name_,
        telephone_number: u_telephone_number_,
        age: u_age_,
        sex: u_sex_,
        status: u_status_,
        exists,
      } = await SMSInstance.getStudent(_studentAddress);

      expect(u_name_).to.equal(u_name);
      expect(u_telephone_number_).to.equal(u_telephone_number);
      expect(u_sex_).to.equal(u_sex);
      expect(exists).to.equal(true);
      expect(u_age_).to.equal(u_age);
    });
    it("should revert if called by non manager", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // updated student info
      const u_name = "Hannah";
      const u_telephone_number = "09124560984";
      const u_age = 25;
      const u_sex = Sex.FEMALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // update user
      await expect(
        SMSInstance.connect(jason).updateStudent(
          _studentAddress,
          u_name,
          u_telephone_number,
          u_age,
          u_sex
        )
      ).to.revertedWithCustomError(SMSInstance, "School__UnAuthorized");
    });
    it("should revert if student is non existent", async () => {
      const [owner, jason, nobody] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // updated student info
      const u_name = "Hannah";
      const u_telephone_number = "09124560984";
      const u_age = 25;
      const u_sex = Sex.FEMALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // update user
      await expect(
        SMSInstance.updateStudent(
          nobody.address,
          u_name,
          u_telephone_number,
          u_age,
          u_sex
        )
      ).to.revertedWithCustomError(SMSInstance, "School__NotFound");
    });
    it("should emit StudentUpdated event", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // updated student info
      const u_name = "Hannah";
      const u_telephone_number = "09124560984";
      const u_age = 25;
      const u_sex = Sex.FEMALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      expect(
        await SMSInstance.updateStudent(
          _studentAddress,
          u_name,
          u_telephone_number,
          u_age,
          u_sex
        )
      )
        .to.emit(SMSInstance, "StudentUpdated")
        .withArgs(_studentAddress);
    });
  });

  describe("Delete student", async () => {
    it("should delete a registered student successfully", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // delete student
      await SMSInstance.deleteStudent(_studentAddress);

      await expect(
        SMSInstance.getStudent(_studentAddress)
      ).to.revertedWithCustomError(SMSInstance, "School__NotFound");
    });
    it("should revert if called by a non-manager", async () => {
      const [owner, jason, nobody] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // delete student
      await expect(
        SMSInstance.connect(nobody).deleteStudent(_studentAddress)
      ).to.revertedWithCustomError(SMSInstance, "School__UnAuthorized");
    });
    it("should emit StudentDeleted event after successful deletion", async () => {
      const [owner, jason] = await ethers.getSigners();

      // student info
      const _studentAddress = jason.address;
      const _name = "Jason";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // register user
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // delete student
      expect(await SMSInstance.deleteStudent(_studentAddress))
        .to.emit(SMSInstance, "StudentDeleted")
        .withArgs(_studentAddress);
    });
  });

  describe("Get active students", async () => {
    it("should return only active students", async () => {
      const [owner, jason, statham, rema] = await ethers.getSigners();

      // student 1 info
      const _studentAddress = statham.address;
      const _name = "Statham";
      const _telephone_number = "09126878958";
      const _age = 21;
      const _sex = Sex.MALE;

      // student 2 info
      const _studentAddress2 = jason.address;
      const _name2 = "Jason";
      const _telephone_number2 = "09126878958";
      const _age2 = 21;
      const _sex2 = Sex.MALE;

      // student 3 info
      const _studentAddress3 = rema.address;
      const _name3 = "Rema";
      const _telephone_number3 = "09126878958";
      const _age3 = 25;
      const _sex3 = Sex.FEMALE;

      // register user 1
      await SMSInstance.registerStudent(
        _studentAddress,
        _name,
        _telephone_number,
        _age,
        _sex
      );

      // register user 2
      await SMSInstance.registerStudent(
        _studentAddress2,
        _name2,
        _telephone_number2,
        _age2,
        _sex2
      );

      // register user 3
      await SMSInstance.registerStudent(
        _studentAddress3,
        _name3,
        _telephone_number3,
        _age3,
        _sex3
      );

      // change rema's status to rusticated
      await SMSInstance.changeStudentStatus(
        _studentAddress3,
        Status.RUSTICATED
      );

      const activeStudents = await SMSInstance.getAllActiveStudents();

      activeStudents.forEach(({ status }) => {
        expect(status).to.equal(Status.ACTIVE);
      });

      expect(activeStudents.length).to.equal(2);
    });
  });

  describe("Get all students", async () => {
    it("should return all students ever created", async () => {
        const [owner, jason, statham, rema] = await ethers.getSigners();

        // student 1 info
        const _studentAddress = statham.address;
        const _name = "Statham";
        const _telephone_number = "09126878958";
        const _age = 21;
        const _sex = Sex.MALE;

        // student 2 info
        const _studentAddress2 = jason.address;
        const _name2 = "Jason";
        const _telephone_number2 = "09126878958";
        const _age2 = 21;
        const _sex2 = Sex.MALE;

        // student 3 info
        const _studentAddress3 = rema.address;
        const _name3 = "Rema";
        const _telephone_number3 = "09126878958";
        const _age3 = 25;
        const _sex3 = Sex.FEMALE;

        // register user 1
        await SMSInstance.registerStudent(
          _studentAddress,
          _name,
          _telephone_number,
          _age,
          _sex
        );

        // register user 2
        await SMSInstance.registerStudent(
          _studentAddress2,
          _name2,
          _telephone_number2,
          _age2,
          _sex2
        );

        // register user 3
        await SMSInstance.registerStudent(
          _studentAddress3,
          _name3,
          _telephone_number3,
          _age3,
          _sex3
        );

        // change rema's status to rusticated
        await SMSInstance.changeStudentStatus(
          _studentAddress3,
          Status.RUSTICATED
        );

        const allStudents = await SMSInstance.getAllStudents();


        expect(allStudents.length).to.equal(3);
    });
  });
});
