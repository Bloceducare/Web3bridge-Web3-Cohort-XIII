// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract SchoolManagement {
    address public owner;
    uint public counter = 0;

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct Student {
        address studentOwner;
        string name;
        uint age;
        string email;
        string homeAddress;
        uint id;
        Status status;
    }

    // Mapping to track students by user address
    mapping(address => Student[]) public userStudents;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only the owner can call this function");
        _;
    }

    function createStudent(string memory _name, uint _age, string memory _email, string memory _homeAddress) external {
        counter++;
        Student memory newStudent = Student({
            studentOwner: msg.sender,
            name: _name,
            age: _age,
            email: _email,
            homeAddress: _homeAddress,
            id: counter,
            status: Status.ACTIVE
        });
        userStudents[msg.sender].push(newStudent);
    }

    function updateStudent(uint _index, string memory _name, uint _age, string memory _homeAddress) external onlyOwner {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        userStudents[msg.sender][_index].name = _name;
        userStudents[msg.sender][_index].age = _age;
        userStudents[msg.sender][_index].homeAddress = _homeAddress;
    }

    function updateStatus(uint _index, Status _new_status) external onlyOwner {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        userStudents[msg.sender][_index].status = _new_status;
    }

    function getStudents() external view returns (Student[] memory) {
        return userStudents[msg.sender];
    }

    function getStudent(uint _index) external view returns (Student memory) {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        return userStudents[msg.sender][_index];
    }

    function getStudentStatus(uint _index) external view returns (string memory) {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        Status status = userStudents[msg.sender][_index].status;
        if (status == Status.ACTIVE) return "ACTIVE";
        if (status == Status.DEFERRED) return "DEFERRED";
        if (status == Status.RUSTICATED) return "RUSTICATED";
        return "";
    }

    function deferStudent(uint _index) external {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        userStudents[msg.sender][_index].status = Status.DEFERRED;
    }

    function rusticateStudent(uint _index) external {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        userStudents[msg.sender][_index].status = Status.RUSTICATED;
    }

    function activateStudent(uint _index) external {
        require(_index < userStudents[msg.sender].length, "Index is invalid or does not exist");
        userStudents[msg.sender][_index].status = Status.ACTIVE;
    }

    function deleteStudent(uint _index) external onlyOwner {
        require(_index < userStudents[msg.sender].length, "Invalid index supplied");
        // Move the last element to the deleted position and pop
        userStudents[msg.sender][_index] = userStudents[msg.sender][userStudents[msg.sender].length - 1];
        userStudents[msg.sender].pop();
    }
}