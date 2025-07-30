// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;


contract StudentManagement {
    Student [] students;
    uint256 id;

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        Gender gender;
        uint256 score;
    }

    enum Status {
        ACTIVE, 
        DEFERRED,
        RUSTICATED 
    }
    enum Gender {
        MALE,
        FEMALE
    }

    function registerStudent(string memory _name, uint256 _age, Gender _gender) external {
        Student memory newStudent;
        newStudent.name = _name;
        newStudent.age = _age;
        newStudent.gender = _gender; 
        newStudent.status = Status.ACTIVE;
        newStudent.id = AssignId();
        students.push(newStudent);
    }

    function getStudent(uint256 _index) external view validateArrayProperties(_index) returns(Student memory)  {
        return students[_index];
    }

    function getAllStudents() external view returns(Student[] memory) {
        return students;
    }

    function setName(string memory _name, uint256 _index) external validateArrayProperties(_index) {
        students[_index].name = _name;
    }

    function getStudentName(uint256 _index) external view validateArrayProperties(_index) returns(string memory)  {
        return students[_index].name;
    }

   
    function setAge(uint256 _age, uint256 _index) external validateArrayProperties(_index) {
        students[_index].age = _age;
    }

    function getStudentAge(uint256 _index) external view validateArrayProperties(_index) returns(uint256)  {
        return students[_index].age;
    }

    function setScore(uint256 _score, uint256 _index) external validateArrayProperties(_index) {
        students[_index].score = _score;
    }

    function getStudentScore(uint256 _index) external view validateArrayProperties(_index) returns(uint256)  {
        return students[_index].score;
    }

    function setGender(Gender _gender, uint256 _index) external validateArrayProperties(_index) {
        students[_index].gender = _gender;
    }

    function getStudentGender(uint256 _index) external view validateArrayProperties(_index) returns(Gender)  {
        return students[_index].gender;
    }

    function setStatus(Status _status, uint256 _index) external validateArrayProperties(_index) {
        students[_index].status = _status;
    }

    function getStudentStatus (uint256 _index) external view validateArrayProperties(_index) returns(Status)  {
        return students[_index].status;
    }

    function deleteStudent(uint256 _index) external validateArrayProperties(_index) {
        delete students[_index];
    }



    function AssignId() private returns(uint256){
        return ++id;
    }

    modifier validateArrayProperties(uint256 _index) {
        require(students.length > 0 && _index < students.length, "invalid index");
       _;
    }

}