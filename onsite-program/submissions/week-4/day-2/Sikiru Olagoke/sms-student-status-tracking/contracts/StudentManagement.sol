// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract StudentManagement {

  address owner;

    struct Student {
        uint id;
        string name;
        uint8 age;
        Gender gender;
        Status status;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    enum Gender {
        MALE,
        FEMALE
    }

    uint256 uniqueId = 0;

    Student[] students;

    constructor(address _owner) {
      owner = _owner;
    }

    function register_student(
        string memory _name,
        uint8 _age,
        Gender _gender
    ) external {
        Student memory _new_student_ = Student(
            uniqueId,
            _name,
            _age,
            _gender,
            Status.ACTIVE
        );

        students.push(_new_student_);

        uniqueId++;
    }

    function update_student(
        uint _index,
        string memory _name,
        uint8 _age,
        Gender _gender,
        Status _status
    ) external {
        students[_index].name = _name;
        students[_index].age = _age;
        students[_index].gender = _gender;
        students[_index].status = _status;
    }

    function get_students() external view returns (Student[] memory) {
        return students;
    }

    function get_student(uint _index) external view returns (Student memory) {
        require(_index <= students.length - 1, "Student does not exits");

        return students[_index];
    }

    function delete_student(uint _index) external {
        require(_index <= students.length - 1, "Student does not exits");
        delete students[_index];
    }

    function change_student_status(uint8 _index, Status _status) external {
        require(_index <= students.length - 1, "Student does not exits");

        students[_index].status = _status;
    }
}
