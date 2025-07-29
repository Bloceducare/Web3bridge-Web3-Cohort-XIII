// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract SchoolManagement {
    enum Gender{
        MALE,FEMALE
    }
    struct Student{
        string name;
        uint age;
        Gender gender;
        uint id;
    }
    Student[] private allStudents;
    function registerStudent(string name,uint age, Gender gender) external {
        require(bytes(name).length>0,"invalid student name");
        require(age> 0,"premature student registration is not allowed");
        uint id = allStudents.length +1001;
        allStudents.push(Student(name, age, gender, id));
    }
    function updateStudentProfile(string name, uint id) public {
        for(int count = -1; ++count<allStudents.length;){
            if(allStudents[count].id== id){
                allStudents[count].name= name;
                return;
            }
        }
    }
    function updateStudentProfile(uint age, uint id) public {
        for(int count = -1; ++count<allStudents.length;){
            if(allStudents[count].id == id){
                allStudents[count].age = age;
                return;
            }
        }
    }

    function updateStudentProfile(uint age, uint id, string memory name) external{
        updateStudentProfile(age, id);
        updateStudentProfile(name, id);
    }

}
