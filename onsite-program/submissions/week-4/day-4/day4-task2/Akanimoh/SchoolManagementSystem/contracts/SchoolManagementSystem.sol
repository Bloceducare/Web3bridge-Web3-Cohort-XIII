// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
    }

    mapping(address => Student[]) public students;

    function register_student(string memory _name, uint256 _age) external {
        Student memory new_student = Student({
            id: students[msg.sender].length,
            name: _name,
            age: _age,
            status: Status.ACTIVE
        });
        students[msg.sender].push(new_student);
    }

    function update_student(uint256 _index, string memory _new_name, uint256 _new_age) external {
        require(_index < students[msg.sender].length, "Invalid index");
        students[msg.sender][_index].name = _new_name;
        students[msg.sender][_index].age = _new_age;
    }

    function update_status(uint256 _index, Status _new_status) external {
        require(_index < students[msg.sender].length, "Invalid index");
        students[msg.sender][_index].status = _new_status;
    }

    function delete_student(uint256 _index) external {
        require(_index < students[msg.sender].length, "Invalid index");
        students[msg.sender][_index] = students[msg.sender][students[msg.sender].length - 1];
        students[msg.sender][_index].id = _index;
        students[msg.sender].pop();
    }

    function get_student(uint256 _index) external view returns (Student memory) {
        require(_index < students[msg.sender].length, "Invalid index");
        return students[msg.sender][_index];
    }

    function get_all_students() external view returns (Student[] memory) {
        return students[msg.sender];
    }

    function get_student_count() external view returns (uint256) {
        return students[msg.sender].length;
    }
}