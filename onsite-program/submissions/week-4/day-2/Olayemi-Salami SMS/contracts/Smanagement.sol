// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Smanagement {
    
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        uint id;
        string name;
        string email;
        uint age;
        Status status;
    }

    Student[] public students;
    uint private studentId = 1;


    function studentReg(string memory _name, string memory _email, uint _age) public {
        students.push(Student(studentId, _name, _email, _age, Status.ACTIVE));
        studentId++;
    }

   
    function updateStudent(uint _id, string memory _name, string memory _email, uint _age) public {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                students[i].name = _name;
                students[i].email = _email;
                students[i].age = _age;
                break;
            }
        }
    }

    function deleteStudent(uint _id) public {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                students[i] = students[students.length - 1];
                students.pop();
                break;
            }
        }
    }

    function changeStatus(uint _id, Status _status) public {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                students[i].status = _status;
                break;
            }
        }
    }

    
    function getStudent(uint _id) public view returns (Student memory) {
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                return students[i];
            }
        }
        revert("Invalid");
    }

   
    function locateAllStudents() public view returns (Student[] memory) {
        return students;
    }
}