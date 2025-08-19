// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StudentManagementSystem {
    struct Student {
        uint id;
        StudentData data;
        StudentStatus status;
    }

    struct StudentData {
        string name;
        uint age;
        string course;
        string studentClass;
    }

    enum StudentStatus {
        ACTIVE,
        DEFFERED,
        RUSTICATED,
        GRADUATED
    }

    Student[] public students;

    function registerStudent(
        string memory name,
        uint age,
        string memory course,
        string memory student_class
    ) external {
        uint studentId = students.length + 1;
        StudentData memory newStudentData = StudentData(
            name,
            age,
            course,
            student_class
        );
        Student memory newStudent = Student(
            studentId,
            newStudentData,
            StudentStatus.ACTIVE
        );
        students.push(newStudent);
    }

    function updateStudentData(
        uint studentId,
        string memory name,
        uint age,
        string memory course,
        string memory student_class
    ) external {
        require(
            studentId > 0 && studentId <= students.length,
            "Invalid student ID"
        );
        Student memory student = students[studentId - 1];
        student.data = StudentData(name, age, course, student_class);
    }

    function deleteStudent(uint studentId) external {
        require(
            studentId > 0 && studentId <= students.length,
            "Invalid student ID"
        );
        delete students[studentId - 1];
    }

    function updateStudentStatus(
        uint studentId,
        StudentStatus status
    ) external {
        require(
            studentId > 0 && studentId <= students.length,
            "Invalid student ID"
        );
        students[studentId - 1].status = status;
    }

    function getStudent(uint studentId) external view returns (Student memory) {
        require(
            studentId > 0 && studentId <= students.length,
            "Invalid student ID"
        );
        return students[studentId - 1];
    }

    function getAllStudents() external view returns (Student[] memory) {
        return students;
    }

    function delete_student_pop_and_shift(uint studentId) external {
        require(
            studentId > 0 && studentId <= students.length,
            "Invalid student ID"
        );
        uint lastIndex = students.length - 1;
        if (studentId - 1 != lastIndex) {
            students[studentId - 1] = students[lastIndex];
        }
        students.pop();
    }
}
