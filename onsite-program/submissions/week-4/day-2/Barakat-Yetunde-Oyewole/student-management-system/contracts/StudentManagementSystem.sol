// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract StudentManagementSystem {
    struct Student_info {
        string name;
        uint age;
        string course;
        uint yearOfStudy;
        Student_Status status;   
    }

    enum Student_Status { Active, Deferred, Rusticated, Graduated }

    Student_info[] public students;

    function student_register(
        string memory _name,
        uint _age,
        string memory _course,
        uint _yearOfStudy
    ) external {
        Student_info memory newStudent = Student_info({
            name: _name,
            age: _age,
            course: _course,
            yearOfStudy: _yearOfStudy,
            status: Student_Status.Active
        });
        students.push(newStudent);
    }

    function update_student_info(
        uint _index,
        string memory _name,
        uint _age,
        string memory _course,
        uint _yearOfStudy
    ) external {
        require(_index <= students.length, "Student does not exist");
        
        Student_info storage student = students[_index];
        student.name = _name;
        student.age = _age;
        student.course = _course;
        student.yearOfStudy = _yearOfStudy;
    }

    function delete_student(uint _index) external {
        require(_index <= students.length, "Student does not exist");
        
        delete students[_index];
    }

    function update_student_status(
        uint _index,
        Student_Status _status
    ) external {
        require(_index <= students.length, "Student does not exist");
        
        students[_index].status = _status;
    }

    function get_student_info(uint _index) external view returns (
        Student_info memory
    ) {
        require(_index <= students.length, "Student does not exist");
        
        return students[_index];
    }

    function get_all_students() external view returns (Student_info[] memory) {
        return students;
    }
}