// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract SchoolManagement {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    enum Status { Active, Rusticated }

    struct Student {
        string name;
        string gender;
        string course;
        uint age;
        Status status;
    }

    mapping(address => Student) public students;
    address[] public studentAddresses;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can perform this action");
        _;
    }

    modifier studentExists(address _student) {
        require(bytes(students[_student].name).length > 0, "Student not found");
        _;
    }

    function registerStudent(string memory _name, string memory _gender, string memory _course, uint _age) external {
        students[msg.sender] = Student(_name, _gender, _course, _age, Status.Active);
        studentAddresses.push(msg.sender);
    }

    function updateInfo(string memory _name, string memory _gender, string memory _course, uint _age) external studentExists(msg.sender) {
        Student storage s = students[msg.sender];
        s.name = _name;
        s.gender = _gender;
        s.course = _course;
        s.age = _age;
    }

    function checkStatus(address _student) external view studentExists(_student) returns (string memory) {
        Status s = students[_student].status;
        if (s == Status.Active) return "Active";
        return "Rusticated";
    }

    function updateStatus(address _student, Status _newStatus) external onlyOwner studentExists(_student) {
        students[_student].status = _newStatus;
    }

    function getStudent(address _student) external view studentExists(_student) returns (Student memory) {
        return students[_student];
    }

    function getAllStudents() external view returns (Student[] memory) {
        Student[] memory all = new Student[](studentAddresses.length);
        for (uint i = 0; i < studentAddresses.length; i++) {
            all[i] = students[studentAddresses[i]];
        }
        return all;
    }

  function deleteStudent(address _student) external onlyOwner studentExists(_student) {
    delete students[_student];
    
}

}
