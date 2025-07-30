// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolSystem {
    struct Student {
        uint id;
        string name;
        uint age;
        Class class;
        Status status;
    }
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }
    enum Class {
        ONE,
        TWO,
        THREE
    }

    Student[] public students;

    function registerStudent(
        string calldata _name,
        uint _age,
        Class _class
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");
        /**
            with this implementation, a user can register a student with the same name,age
            and class multiple times but get different IDs, solution is to have a stop checker,
            maybe a email to prevent duplicate registration.
         */
        Student memory newStudent = Student({
            id: students.length + 1,
            name: _name,
            age: _age,
            class: _class,
            status: Status.ACTIVE
        });

        students.push(newStudent);
    }

    function getStudent(uint _id) external view returns (Student memory) {
        require(_id > 0 && _id < students.length + 1, "Invalid student ID");
        return students[_id - 1];
    }

    function getAllStudents() external view returns(Student[] memory) {
        return students;
    }

    function updateStudentInfo(uint _id, string calldata _name, uint _age, Class _class) external {
        require(_id > 0 && _id < students.length + 1, "Invalid student ID");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_age > 0, "Age must be greater than 0");

        Student memory student_to_update = students[_id - 1];
        student_to_update.name = _name;
        student_to_update.age = _age;
        student_to_update.class = _class;
        
        students[_id - 1] = student_to_update;
    }

    function updateStudentStatus(uint _id, Status _status) external {
        require(_id > 0 && _id < students.length + 1, "Invalid student ID");

        Student memory student_to_update = students[_id - 1];
        student_to_update.status = _status;
        students[_id - 1] = student_to_update;
    }

    function deleteStudent(uint _id) external {
        require(_id > 0 && _id < students.length + 1, "Invalid student ID");

        delete students[_id - 1];
    }

    // personal : read about modifiers and use them to reduce code duplication
}
