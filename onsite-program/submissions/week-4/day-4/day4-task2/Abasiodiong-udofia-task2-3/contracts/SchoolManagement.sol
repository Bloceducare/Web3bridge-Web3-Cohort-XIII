// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SchoolManagement {
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool exists;
    }

    struct School {
        string name;
        mapping(uint256 => Student) students; 
        uint256 nextId; 
        uint256 studentCount;
    }

    mapping(address => School) public schools;

    event SchoolCreated(address indexed user, string schoolName);
    event StudentRegistered(address indexed schoolOwner, uint256 id, string name, uint256 age, Status status);
    event StudentUpdated(address indexed schoolOwner, uint256 id, string name, uint256 age, Status status);
    event StudentDeleted(address indexed schoolOwner, uint256 id);

    function createSchool(string memory _schoolName) public {
        require(bytes(_schoolName).length > 0, "School name cannot be empty");
        schools[msg.sender].name = _schoolName;
        emit SchoolCreated(msg.sender, _schoolName);
    }

    function registerStudent(string memory _name, uint256 _age) public {
        require(bytes(schools[msg.sender].name).length > 0, "School not created");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");

        School storage school = schools[msg.sender];
        uint256 studentId = school.nextId;
        school.students[studentId] = Student(studentId, _name, _age, Status.ACTIVE, true);
        school.studentCount++;
        school.nextId++;
        emit StudentRegistered(msg.sender, studentId, _name, _age, Status.ACTIVE);
    }

    function updateStudent(uint256 _id, string memory _name, uint256 _age, Status _status) public {
        require(bytes(schools[msg.sender].name).length > 0, "School not created");
        require(schools[msg.sender].students[_id].exists, "Student does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");

        School storage school = schools[msg.sender];
        school.students[_id].name = _name;
        school.students[_id].age = _age;
        school.students[_id].status = _status;
        emit StudentUpdated(msg.sender, _id, _name, _age, _status);
    }

    function deleteStudent(uint256 _id) public {
        require(bytes(schools[msg.sender].name).length > 0, "School not created");
        require(schools[msg.sender].students[_id].exists, "Student does not exist");

        School storage school = schools[msg.sender];
        school.students[_id].exists = false;
        school.studentCount--;
        emit StudentDeleted(msg.sender, _id);
    }

    function getStudent(uint256 _id) public view returns (uint256, string memory, uint256, Status, bool) {
        require(bytes(schools[msg.sender].name).length > 0, "School not created");
        require(schools[msg.sender].students[_id].exists, "Student does not exist");

        Student memory student = schools[msg.sender].students[_id];
        return (student.id, student.name, student.age, student.status, student.exists);
    }

    function getAllStudentIds() public view returns (uint256[] memory) {
        require(bytes(schools[msg.sender].name).length > 0, "School not created");
        School storage school = schools[msg.sender];
        uint256[] memory studentIds = new uint256[](school.studentCount);
        uint256 index = 0;

        for (uint256 i = 0; i < school.nextId; i++) {
            if (school.students[i].exists) {
                studentIds[index] = i;
                index++;
            }
        }
        return studentIds;
    }

    function getSchool(address _user) public view returns (string memory, uint256) {
        return (schools[_user].name, schools[_user].studentCount);
    }
}