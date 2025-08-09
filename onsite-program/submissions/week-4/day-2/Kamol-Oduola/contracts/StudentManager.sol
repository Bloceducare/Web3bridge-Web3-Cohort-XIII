// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract StudentManager {

    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        string name;
        uint256 id;
        uint age;
        Status status;
    }

    Student[] public students;
    uint256 public studentCount = 0;

    // Add a new student
    function addStudent(string memory _name, uint age) public {
        students.push(Student(_name, studentCount, age, Status.ACTIVE));
        studentCount++;
    }

    
    function getStudent(uint256 _id) public view returns (string memory) {
        require(_id < studentCount, "Invalid Id");
        return students[_id].name;
    }

    
    function updateStudent(uint256 _id, string memory _name, uint age, Status _status) public {
        require(_id < studentCount, "Invalid Id");

        Student storage student = students[_id];
        student.name = _name;
        student.age = age;
        
        student.status = (_status != Status.ACTIVE) ? Status.RUSTICATED : Status.ACTIVE;
    }

    function getStudentStatus(uint256 _id) public view returns (Status) {
        require(_id < studentCount, "Invalid Id");
        return students[_id].status;
    }
    
    function deleteStudent(uint256 id) public{
        delete students[id];
    }
}
