// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

    mapping(address => Student[]) public students;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only the owner can call this function");
        _;
    }

    function createStudent(
        string memory _name,
        uint _age,
        string memory _email,
        string memory _homeAddress
    ) external {
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
        students[msg.sender].push(newStudent);
    }

    function updateStudent(
        uint _index,
        string memory _name,
        uint _age,
        string memory _homeAddress
    ) external onlyOwner {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        students[msg.sender][_index].name = _name;
        students[msg.sender][_index].age = _age;
        students[msg.sender][_index].homeAddress = _homeAddress;
    }

    function updateStatus(uint _index, Status _new_status) external onlyOwner {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        students[msg.sender][_index].status = _new_status;
    }

    function getStudents() external view returns (Student[] memory) {
        return students[msg.sender];
    }

    function getStudent(uint _index) external view returns (Student memory) {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        return students[msg.sender][_index];
    }

    function getStudentStatus(uint _index) external view returns (string memory) {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        Status status = students[msg.sender][_index].status;
        if (status == Status.ACTIVE) return "ACTIVE";
        if (status == Status.DEFERRED) return "DEFERRED";
        if (status == Status.RUSTICATED) return "RUSTICATED";
        return "";
    }

    function deferStudent(uint _index) external {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        students[msg.sender][_index].status = Status.DEFERRED;
    }

    function rusticateStudent(uint _index) external {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        students[msg.sender][_index].status = Status.RUSTICATED;
    }

    function activateStudent(uint _index) external {
        require(_index < students[msg.sender].length, "Index is invalid or does not exist");
        students[msg.sender][_index].status = Status.ACTIVE;
    }

    function deleteStudent(uint _index) external onlyOwner {
        require(_index < students[msg.sender].length, "Invalid index supplied");
        delete students[msg.sender][_index];
    }
}