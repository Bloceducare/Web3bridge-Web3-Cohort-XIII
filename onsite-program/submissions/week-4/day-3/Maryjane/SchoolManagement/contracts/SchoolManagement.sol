// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract SchoolManagement {
    error STUDENT_NOT_FOUND();
    error INVALID_ID();

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    struct StudentDetails {
        uint256 studentId;
        string studentName;
        string studentCourse;
        uint256 studentAge;
        Status studentStatus;
    }

    uint256 private nextStudentId;
    mapping(uint256 => StudentDetails) public students;
    uint256[] public studentIdList;

    function registerStudent(string memory _studentName, string memory _studentCourse, uint256 _studentAge) external {
        nextStudentId++;
        students[nextStudentId] = StudentDetails(nextStudentId, _studentName, _studentCourse, _studentAge, Status.ACTIVE);
        studentIdList.push(nextStudentId);
    }

    function updateStudent(uint256 _studentId, string memory _newName) external {
        if (students[_studentId].studentId == 0) revert STUDENT_NOT_FOUND();
        students[_studentId].studentName = _newName;
    }

    function getStudentById(uint256 _studentId) external view returns (StudentDetails memory) {
        if (students[_studentId].studentId == 0) revert STUDENT_NOT_FOUND();
        return students[_studentId];
    }

    function updateStudentStatus(uint256 _studentId, Status _newStatus) external {
        if (students[_studentId].studentId == 0) revert INVALID_ID();
        students[_studentId].studentStatus = _newStatus;
    }

    function deleteStudent(uint256 _studentId) external {
        if (students[_studentId].studentId == 0) revert STUDENT_NOT_FOUND();
        delete students[_studentId];
        for (uint256 i = 0; i < studentIdList.length; i++) {
            if (studentIdList[i] == _studentId) {
                studentIdList[i] = studentIdList[studentIdList.length - 1];
                studentIdList.pop();
                return;
            }
        }
    }

    function getAllStudents() external view returns (StudentDetails[] memory) {
        uint256 count = studentIdList.length;
        StudentDetails[] memory result = new StudentDetails[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = students[studentIdList[i]];
        }
        return result;
    }
}
