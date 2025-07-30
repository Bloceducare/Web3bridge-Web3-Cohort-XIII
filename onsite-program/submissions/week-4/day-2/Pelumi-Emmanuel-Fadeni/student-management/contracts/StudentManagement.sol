// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StudentManagement {
    struct Student{
        string name;
        uint256 age;
        string course;
        uint256 Id;
        Status status;

    }
    uint public uniqueId = 0;
    enum Status { Active, Defered, Rusticated}
     Student[] public students;

     function registerNewStudent(string memory _name, uint _age, string memory _course) public {
        Student memory newStudent = Student({name: _name, age: _age, course: _course, Id: uniqueId, status: Status.Active}); 
        students.push(newStudent);
        uniqueId++;
     }
     function updateStudentDetails(uint _index, string memory newName, uint newAge, string memory newCourse, uint newId) public {
        require (_index <= students.length, "Invalid student index");
        students[_index].name = newName;
        students[_index].age = newAge;
        students[_index].course = newCourse;
        students[_index].Id = newId;
     }

     function updateStudentStatus(uint _index, Status newStatus) external returns (Student memory) {
        require(_index < students.length, "index not in order");
        Student storage student = students[_index];
        student.status = newStatus;
        return student;
     }
     function viewEachStudentDetails(uint _index) external view returns  (string memory, uint, string memory, uint, Status) {
        require (_index < students.length, "Invalid student index");
        Student storage student = students[_index];
        return (student.name, student.age, student.course, student.Id, student.status);
     }
     function viewAllStudentsDetails() external view returns (Student[] memory) {
        return students;
     }

     function deleteStudentDetails(uint _index) external {
        require (_index < students.length, "Invalid student index");
        delete students[_index];
     }

}