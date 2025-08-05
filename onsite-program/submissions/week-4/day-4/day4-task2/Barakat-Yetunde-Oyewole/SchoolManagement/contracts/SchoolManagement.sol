// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract StudentManagementSystem {
    error STUDENT_NOT_FOUND(string reason);
    error INVALID_INPUT(string reason);
    error STUDENT_ALREADY_EXISTS(string reason);
    error UNAUTHORIZED_ACCESS(string reason);

    enum StudentStatus {
        Active,
        Deferred,
        Rusticated,
        Graduated
    }

    struct Student {
        string name;
        uint age;
        string course;
        uint yearOfStudy;
        StudentStatus status;
        address creator;
    }

    mapping(address => Student) private students;
    address[] private studentAddresses;

    modifier studentExists(address _studentAddress) {
        if (bytes(students[_studentAddress].name).length == 0) {
            revert STUDENT_NOT_FOUND("Student not found");
        }
        _;
    }

    modifier studentDoesNotExist(address _studentAddress) {
        if (bytes(students[_studentAddress].name).length != 0) {
            revert STUDENT_ALREADY_EXISTS("Student already exists");
        }
        _;
    }

    modifier onlyCreator(address _studentAddress) {
        if (students[_studentAddress].creator != msg.sender) {
            revert UNAUTHORIZED_ACCESS("Only creator can modify or delete student");
        }
        _;
    }

    function registerStudent(
        address _studentAddress,
        string memory _name,
        uint _age,
        string memory _course,
        uint _yearOfStudy
    ) external studentDoesNotExist(_studentAddress) {
        if (bytes(_name).length == 0) revert INVALID_INPUT("Name cannot be empty");
        if (bytes(_course).length == 0) revert INVALID_INPUT("Course cannot be empty");
        if (_age == 0) revert INVALID_INPUT("Age must be greater than zero");

        students[_studentAddress] = Student({
            name: _name,
            age: _age,
            course: _course,
            yearOfStudy: _yearOfStudy,
            status: StudentStatus.Active,
            creator: msg.sender
        });

        studentAddresses.push(_studentAddress);
    }

    function updateStudentInfo(
        address _studentAddress,
        string memory _name,
        uint _age,
        string memory _course,
        uint _yearOfStudy
    ) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        if (bytes(_name).length == 0) revert INVALID_INPUT("Name cannot be empty");
        if (bytes(_course).length == 0) revert INVALID_INPUT("Course cannot be empty");

        Student storage student = students[_studentAddress];
        student.name = _name;
        student.age = _age;
        student.course = _course;
        student.yearOfStudy = _yearOfStudy;
    }

    function updateStudentStatus(
        address _studentAddress,
        StudentStatus _status
    ) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        students[_studentAddress].status = _status;
    }

    function getStudent(address _studentAddress) external view studentExists(_studentAddress) returns (Student memory) {
        return students[_studentAddress];
    }

    function getAllStudents() external view returns (Student[] memory) {
        Student[] memory result = new Student[](studentAddresses.length);
        for (uint i = 0; i < studentAddresses.length; i++) {
            result[i] = students[studentAddresses[i]];
        }
        return result;
    }

    function deleteStudent(address _studentAddress) external studentExists(_studentAddress) onlyCreator(_studentAddress) {
        delete students[_studentAddress];

        for (uint i = 0; i < studentAddresses.length; i++) {
            if (studentAddresses[i] == _studentAddress) {
                studentAddresses[i] = studentAddresses[studentAddresses.length - 1];
                studentAddresses.pop();
                break;
            }
        }
    }

    function getAllStudentAddresses() external view returns (address[] memory) {
        return studentAddresses;
    }
}
