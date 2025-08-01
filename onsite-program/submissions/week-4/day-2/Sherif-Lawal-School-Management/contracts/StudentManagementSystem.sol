// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StudentManagementSystem {

     struct Student {
        string name;
        uint age;
        Status status;
        Gender gender;
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

    Student [] students;

    function create_student(
        string memory _name, 
        uint _age,
        Gender _gender
        ) external {

        Student memory new_student_ = Student(
            _name,
            _age,
            Status.ACTIVE,
            _gender
        );

        students.push(new_student_);

        uniqueId++;
    }


        function update_student(
            uint256 _index, 
            string memory _new_name,
            uint _new_age
            ) external 
    {
        require(_index <= students.length, "Invalid index");

        students[_index].name = _new_name;
        students[_index].age =  _new_age;
    }

    function update_student_status(uint256 _index, Status _new_status) external {
        require(_index < students.length, "Invalid index");

        students[_index].status = _new_status;
    }

    function get_students() external view returns (Student[] memory) {
        return students;
    }

    function delete_student(uint _index) external {
        require(_index <= students.length, "Invalid index");

        students[_index] = students[students.length -1];
        students.pop(); 
    }


}
