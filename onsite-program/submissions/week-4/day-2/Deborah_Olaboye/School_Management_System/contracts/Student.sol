// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

contract SchoolManagementSystem {

    struct Student {
        string name;
        uint age;
        string email;
        Gender gender;
        Status status;
    }

    Student[] public students;

    enum Gender {
        male,
        female
    }

    enum Status { 
        ACTIVE,
        DEFERRED,
        RUSTICATED 
    }

    function RegisterStudent (string memory _name, uint _age, string memory _email, Gender _gender, Status _status) external {
        students.push(Student({name: _name, age: _age, email: _email, gender: _gender, status: _status}));
    }

    function UpdateStudent (uint id, string memory _new_name, uint _new_age) external {
        require(id < students.length, "Student does not exist");
        students[id].name = _new_name;
        students[id].age = _new_age;
    }

    function DeleteStudent (uint id) external {
        require(id < students.length, "Student does not exist");
        delete students[id];
    }

    function ChangeStatus (uint id, Status _new_status) external {
        require(id < students.length, "Student does not exist");
        students[id].status = _new_status;
    }

    function ViewStudent(uint id) external view returns(string memory name, uint age, string memory email, Gender gender, Status status) {
        require(id < students.length, "Student does not exist");
        return (students[id].name, students[id].age, students[id].email, students[id].gender, students[id].status);
    }

    function ViewStudents() external view returns (Student[] memory) {
        return students;
    }
}