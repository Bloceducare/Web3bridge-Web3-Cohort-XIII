//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagement {

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentData {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool registrationCompleted;
        address studentAddress;
    }

    StudentData[] public students;
    uint256 public studentId = 1;
    
    mapping(address => StudentData) public addressToStudent;
    mapping(uint256 => StudentData) public studentIdToData;
    mapping(address => bool) public isRegisteredStudent;

    function registerStudent(string memory _name, uint256 _age) external {
        require(_age > 0 && _age < 50, "INVALID AGE");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!isRegisteredStudent[msg.sender], "Already registered");

        StudentData memory newStudent = StudentData({
            id: studentId,
            name: _name,
            age: _age,
            status: Status.ACTIVE,
            registrationCompleted: true,
            studentAddress: msg.sender
        });

        addressToStudent[msg.sender] = newStudent;
        studentIdToData[studentId] = newStudent;
        students.push(newStudent);
        isRegisteredStudent[msg.sender] = true;

        studentId++;
    }

    function getStudentId(uint256 _id) internal view returns(uint256) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _id) {
                return i;
            }
        }
        revert("Student with this ID does not exist");
    }

    function getStudent(uint256 _id) external view returns(
        uint256 id, 
        string memory name,
        uint256 age,
        Status status,
        bool registrationCompleted
    ) {
        StudentData memory student = studentIdToData[_id];
        require(student.id != 0, "Student does not exist");
        
        return (
            student.id,
            student.name,
            student.age,
            student.status,
            student.registrationCompleted
        );
    }

    function getStudentByAddress(address _studentAddress) external view returns(
        uint256 id,
        string memory name,
        uint256 age,
        Status status,
        bool registrationCompleted
    ) {
        require(isRegisteredStudent[_studentAddress], "Address not registered");
        StudentData memory student = addressToStudent[_studentAddress];
        
        return (
            student.id,
            student.name,
            student.age,
            student.status,
            student.registrationCompleted
        );
    }

    function getMyStudentData() external view returns(
        uint256 id,
        string memory name,
        uint256 age,
        Status status,
        bool registrationCompleted
    ) {
        require(isRegisteredStudent[msg.sender], "Not registered");
        StudentData memory student = addressToStudent[msg.sender];
        
        return (
            student.id,
            student.name,
            student.age,
            student.status,
            student.registrationCompleted
        );
    }

    function getStudents() external view returns(StudentData[] memory) {
        return students;
    }

    function updateStatus(uint256 _id, Status _new_status) external {
        require(studentIdToData[_id].id != 0, "Student does not exist");
        
        uint256 index = getStudentId(_id);
        studentIdToData[_id].status = _new_status;
        students[index].status = _new_status;
        
        address studentAddr = studentIdToData[_id].studentAddress;
        addressToStudent[studentAddr].status = _new_status;
    }

    function updateStudentData(uint256 _id, string memory _name, uint256 _age) external {
        require(studentIdToData[_id].id != 0, "Student does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0 && _age < 50, "Invalid age");
        
        uint256 index = getStudentId(_id);

        students[index].name = _name;
        students[index].age = _age;

        studentIdToData[_id].name = _name;
        studentIdToData[_id].age = _age;
        
        address studentAddr = studentIdToData[_id].studentAddress;
        addressToStudent[studentAddr].name = _name;
        addressToStudent[studentAddr].age = _age;
    }

    function updateMyStudentData(string memory _name, uint256 _age) external {
        require(isRegisteredStudent[msg.sender], "Not registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0 && _age < 50, "Invalid age");

        addressToStudent[msg.sender].name = _name;
        addressToStudent[msg.sender].age = _age;

        uint256 stuId = addressToStudent[msg.sender].id;
        studentIdToData[stuId].name = _name;
        studentIdToData[stuId].age = _age;

        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].studentAddress == msg.sender) {
                students[i].name = _name;
                students[i].age = _age;
                break;
            }
        }
    }

    function deleteStudent(uint256 _id) external {
        require(studentIdToData[_id].id != 0, "Student does not exist");
        
        uint256 index = getStudentId(_id);
        address studentAddr = students[index].studentAddress;
        
        students[index] = students[students.length - 1];
        students.pop();

        delete studentIdToData[_id];
        delete addressToStudent[studentAddr];
        isRegisteredStudent[studentAddr] = false;
    }
}