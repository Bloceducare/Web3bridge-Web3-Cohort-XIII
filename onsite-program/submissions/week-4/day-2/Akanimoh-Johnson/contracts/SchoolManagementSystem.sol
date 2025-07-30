// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SchoolManagementSystem {

    struct Student {
        uint256 id; 
        string name;
        uint256 age;
        Status status;
    }

    enum Status { ACTIVE, DEFERRED, RUSTICATED }
  
    Student[] public students;

    function register_student(string memory _name, uint256 _age) external {
        Student memory new_student = Student({
            id: students.length, 
            name: _name,
            age: _age,
            status: Status.ACTIVE 
        });
        students.push(new_student);
    }


    function update_student(uint256 _index, string memory _new_name, uint256 _new_age) external {
        require(_index < students.length, "Invalid index");
        students[_index].name = _new_name;
        students[_index].age = _new_age;
    }


    function update_status(uint256 _index, Status _new_status) external {
        require(_index < students.length, "Invalid index");
        students[_index].status = _new_status;
    }


    function delete_student(uint256 _index) external {
        require(_index < students.length, "Invalid index");
        students[_index] = students[students.length - 1];
        students[_index].id = _index;
        students.pop();
    }


    function get_student(uint256 _index) external view returns (Student memory) {
        require(_index < students.length, "Invalid index");
        return students[_index];
    }


    function get_all_students() external view returns (Student[] memory) {
        return students;
    }
}