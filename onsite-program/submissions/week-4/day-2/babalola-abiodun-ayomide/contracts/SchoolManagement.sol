// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract SchoolManagement {
    enum Gender{MALE,FEMALE}
    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    struct Student{
        string name;
        uint age;
        Gender gender;
        uint id;
        Status status;
    }
    Student[] private allStudents;
    function registerStudent(string memory name,uint age, Gender gender) external {
        require(bytes(name).length>0,"invalid student name");
        require(age> 0,"premature student registration is not allowed");
        uint id = allStudents.length +1001;
        allStudents.push(Student(name, age, gender, id,Status.ACTIVE));
    }
    function updateStudentProfile(string memory name, uint id) public {
        require(bytes(name).length>0,"invalid student name");
    for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id== id){
                allStudents[count].name= name;
                return;
            }
        }
        revert("Student with id not found");
    }
    function updateStudentProfile(uint age, uint id) public {
        require(age > 0, "Invalid age");
    for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id == id){
                allStudents[count].age = age;
                return;
            }
        }
        revert("Student with id not found");
    }

    function updateStudentProfile(uint age, uint id, string memory name) external{
        updateStudentProfile(age, id);
        updateStudentProfile(name, id);
    }

    function suspendStudent(uint id) external{

        for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id == id){
                require(allStudents[count].status == Status.ACTIVE, "Only active students can be suspended");
                allStudents[count].status = Status.DEFERRED;
                return;
            }
        }
        revert("Student with id not found");
    }

    function cancelStudentSuspension(uint id) external{
        for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id == id){
                require(allStudents[count].status == Status.DEFERRED, "Student not suspended");
                allStudents[count].status = Status.ACTIVE;
                return;
            }
        }
        revert("Student with id not found");
    }

    function getStudentBy(uint id) external view returns (Student memory){
        for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id == id){
                return allStudents[count];
            }
        }
        revert("Student with id not found");
    }

    function getAllStudents() external view returns (Student[] memory){
       return allStudents;
    }

    function rusticateStudent(uint id) external {

        for (uint count = 0; count < allStudents.length; count++){
            if(allStudents[count].id == id){
                require(allStudents[count].status != Status.RUSTICATED, "Already rusticated");
                allStudents[count].status = Status.RUSTICATED;
                return;
            }
        }
        revert("Student with id not found");
    }
}
