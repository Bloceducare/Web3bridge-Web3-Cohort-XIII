// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SchMSys {

     enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        string name;
        uint age;
        Status status;
        bool exists; 
    }

    Student[] public students;

    
    function registerStudent(string memory _name, uint _age) external {
        students.push(Student(_name, _age, Status.ACTIVE, true));
    }

    
    function updateStudent(uint _id, string memory _name, uint _age) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        students[_id].name = _name;
        students[_id].age = _age;
    }

       function deleteStudent(uint _id) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student already deleted");

       
        students[_id].exists = false;
    }

  
    function changeStatus(uint _id, Status _status) public {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        students[_id].status = _status;
    }

    function getStudent(uint _id) public view returns (Student memory) {
        require(_id < students.length, "Invalid ID");
        require(students[_id].exists, "Student does not exist");

        return students[_id];
    }

    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }


    function getTotalStudents() public view returns (uint) {
        return students.length;
    }
}
