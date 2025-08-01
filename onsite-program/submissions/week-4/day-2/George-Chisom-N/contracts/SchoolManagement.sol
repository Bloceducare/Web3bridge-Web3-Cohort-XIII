// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SchoolManagement {
    

     // struct of students
    struct Student {
        uint256 studentId;
        string name;
        uint256 age;
        Gender student_gender;
        Status student_status;
    }

    //enum for status
    enum Status { ACTIVE, DEFERRED, RUSTICATED }

    // enum for gender
    enum Gender { male, female, shemale }

    Student[] public StudentArray;


    // function to register student
    function register_student( uint256 _studentId, string memory _name, uint256 _age, Gender _student_gender, Status _student_status ) external {
        Student memory newStudent = Student({ studentId: _studentId, name: _name, age: _age, student_gender: _student_gender, student_status: _student_status });
        StudentArray.push(newStudent);
        require(_studentId <= StudentArray.length, "invalid Student Index");
        // require(_age <= , "Too Young for this class");
    }

    // function to update students
    function update_studentData(uint256 _studentId, string memory _newname, uint256 _newage) external {
        require(_studentId < StudentArray.length, "invalid Student Index");
        StudentArray[_studentId].name = _newname;
        StudentArray[_studentId].age = _newage; 
    }

    // function to delete students
    function delete_student(uint256 _studentId) external {
        require(_studentId <= StudentArray.length, "invalid Student Index");
        delete StudentArray[_studentId];
    }

    // function to update students status
    function student_status(uint256 _studentId, Status _new_student_status) external {
        require(_studentId <= StudentArray.length, "invalid Student Index");
        StudentArray[_studentId].student_status = _new_student_status;
    }

    // function to view students
    function view_student_data(uint256 _studentId) external view returns (Student memory) {
        return StudentArray[_studentId];
    }

    // function to view all students
    function view_all_student_data() external view returns (Student[] memory) {
        return StudentArray;
    }

}