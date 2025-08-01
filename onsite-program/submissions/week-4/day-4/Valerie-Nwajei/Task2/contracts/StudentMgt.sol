// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StudentMgt{
    struct Student{
        string firstName;
        string lastName;
        string department;
        uint studentId;
        uint8 age;
        Status status;
        bool exists;
    }

    enum Status{
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }
    
    uint private nextStudentId;

    Student [] public students;
    mapping(uint => Student) private studentById; 
    mapping(uint => uint) private studentIdToIndex;

    constructor(){
        nextStudentId = 0;
    }

    function register(string memory _firstName, string memory _lastName, string memory _department, uint _studentId, uint8 _age) external{
        students.push(Student(_firstName, _lastName, _department, _studentId, _age, Status.ACTIVE, true));
        nextStudentId++;
    }

    function updateDetails(uint _index, string memory _newFirstName, string memory _newLastName, string memory _newDepartment, uint8 _newAge) external{
        require(_index < students.length, "No Records Found");
        students[_index].firstName = _newFirstName;
        students[_index].lastName = _newLastName;
        students[_index].department = _newDepartment;
        students[_index].age = _newAge;
    }

    function changeStatus(uint _index, Status _newStatus)external{
        students[_index].status = _newStatus;
    }

     
    function deleteStudent(uint _index)external{
        require(_index<students.length, "No Records Found");
        delete students[_index];
    }

    function getStudents()external view returns (Student[] memory){
        return students;
    }
    
    function getStudentById(uint _studentId) external view returns (Student memory){
        require(studentById[_studentId].exists, "Student not found");
        return studentById[_studentId];
    }

   
}