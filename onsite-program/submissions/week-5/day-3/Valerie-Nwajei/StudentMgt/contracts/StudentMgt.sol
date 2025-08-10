// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StudentMgt {
    struct Student {
        string firstName;
        string lastName;
        string department;
        uint studentId;
        uint8 age;
        Status status;
        bool exists;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    uint public nextStudentId;

    Student[] public students;
    mapping(uint => Student) public studentById;
    mapping(uint => uint) public studentIdToIndex;

    constructor() {
        nextStudentId = 1;
    }

    function register(
        string memory _firstName,
        string memory _lastName,
        string memory _department,
        uint8 _age
    ) external {
        Student memory newstudent = Student(
            _firstName,
            _lastName,
            _department,
            nextStudentId,
            _age,
            Status.ACTIVE,
            true
        );
        students.push(newstudent);
        studentById[nextStudentId] = newstudent;
        nextStudentId++;
    }

    function updateDetails(
        uint _index,
        string memory _newFirstName,
        string memory _newLastName,
        string memory _newDepartment,
        uint8 _newAge
    ) external {
        require(_index < students.length, "No Records Found");
        students[_index].firstName = _newFirstName;
        students[_index].lastName = _newLastName;
        students[_index].department = _newDepartment;
        students[_index].age = _newAge;
    }

    function changeStatus(uint _index, Status _newStatus) external {
        students[_index].status = _newStatus;
    }

    function deleteStudent(uint _index) external {
        require(_index < students.length, "No Records Found");
        students[_index] = students[students.length - 1];
        students.pop();
    }

    function getStudents() external view returns (Student[] memory) {
        return students;
    }

    function getStudentCount() external view returns (uint) {
        return students.length;
    }

    function getStudentById(
        uint _studentId
    ) external view returns (Student memory) {
        require(studentById[_studentId].exists, "Student not found");
        return studentById[_studentId];
    }
}
