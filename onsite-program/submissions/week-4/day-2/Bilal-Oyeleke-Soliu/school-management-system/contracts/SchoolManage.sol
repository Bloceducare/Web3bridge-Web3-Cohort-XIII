// SPDX-License-Identifier: UNLICENSED
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

    Student[] public students;

    constructor(address _owner) {
        owner = _owner;
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
        students.push(newStudent);
    }

    function updateStudent(uint _index, string memory _name, uint _age, string memory _homeAddress) external onlyOwner {
        require(_index < students.length, "Index is invalid or does not exist");
        students[_index].name = _name;
        students[_index].age = _age;
        students[_index].homeAddress = _homeAddress;
    }

    function getStudents() external view returns (Student[] memory) {
        return students;
    }

    function getStudent(uint _index) external view returns (Student memory) {
        require(_index < students.length, "Index is invalid or does not exist");
        return students[_index];
    }

    function getStudentStatus(uint _index) external view returns (string memory) {
        require(_index < students.length, "Index is invalid or does not exist");
        Status status = students[_index].status;
        if (status == Status.ACTIVE) return "ACTIVE";
        if (status == Status.DEFERRED) return "DEFERRED";
        if (status == Status.RUSTICATED) return "RUSTICATED";
        return "";
    }

    function deferStudent(uint _index) external {
        require(_index < students.length, "Index is invalid or does not exist");
        students[_index].status = Status.DEFERRED;
    }

    function rusticateStudent(uint _index) external {
        require(_index < students.length, "Index is invalid or does not exist");
        students[_index].status = Status.RUSTICATED;
    }

    function activateStudent(uint _index) external {
        require(_index < students.length, "Index is invalid or does not exist");
        students[_index].status = Status.ACTIVE;
    }

    function deleteStudent(uint _index) external onlyOwner {
        require(_index < students.length, "Invalid index supplied");
        delete students[_index];
    }
}
