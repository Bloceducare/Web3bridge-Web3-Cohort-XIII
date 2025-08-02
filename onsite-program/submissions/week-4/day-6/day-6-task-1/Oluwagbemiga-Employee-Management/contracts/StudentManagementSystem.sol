// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.30;

enum Status {
    ACTIVE,
    DEFERRED,
    RUSTICATED
}

enum Class {
    JS1,
    JS2,
    JS3,
    SS1,
    SS2,
    SS3
}

struct Student {
    uint id;
    string name;
    uint age;
    Status status;
    Class class;
}

error StudentNotFound(uint studentId);

contract SchoolManagementSystem {

    /*
        On algorithm basis:
            1. One Address maps to the corresponding student details for that address.
    */

    Student[] students;

    // this id is dynamic and it'd change with respect to the amount of students we add per time via registeration.
    uint numId;

    mapping(uint studentId => Student student) unique_student;

    function registerStudentDetails(string memory new_name, uint new_age, Status new_status, 
        Class new_class
    ) public returns (bool, uint){
        
        uint student_id = numId++;

        // apply the function inputs to the student at this current id.
        students[student_id].name = new_name;
        students[student_id].age = new_age;
        students[student_id].status = new_status;
        students[student_id].class = new_class;
 
        return (true, student_id);
    }

    function updateStudentDetails(uint student_id, string memory update_name, uint update_age) public returns (Student memory) {
        if (student_id > students.length) revert StudentNotFound({
                studentId: student_id
            });
        students[student_id].name = update_name;
        students[student_id].age = update_age;

        return students[student_id];
    }

    function deleteStudentDetails(uint student_id) public {
    //    Student memory foundStudent;
    }
}