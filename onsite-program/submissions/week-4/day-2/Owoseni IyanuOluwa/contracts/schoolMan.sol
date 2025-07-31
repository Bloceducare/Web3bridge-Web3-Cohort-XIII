// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    
    enum Status { 
        ACTIVE, 
        DEFERRED, 
        RUSTICATED 
    }
    
    
    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool exists; 
    }
    
    Student[] public students;
    
    uint256 public nextId = 1;
    
   
    function registerStudent(string memory _name, uint256 _age) public returns (uint256) {
        Student memory newStudent = Student({
            id: nextId,
            name: _name,
            age: _age,
            status: Status.ACTIVE, 
            exists: true
        });
        
        students.push(newStudent);
        
        // uint256 currentId = nextId;
        
        // nextId = nextId + 1;
        totalActiveStudents= totalActiveStudents+1;
        
        return nextId+1;
    }
    
    
    function updateStudent(uint256 _studentId, string memory _newName, uint256 _newAge) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                students[i].name = _newName;
                students[i].age = _newAge;
                return; 

                // require(sender==msg.sender, "invalid sender")

            }
        }
         revert("Student not found or does not exist");
    }
    
    
    function deleteStudent(uint256 _studentId) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                students[i].exists = false;
                return; 
            }
        }
    }
    
    
    function changeStudentStatus(uint256 _studentId, Status _newStatus) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                students[i].status = _newStatus;
                return;
            }
        }
    }
    
   
    function getStudent(uint256 _studentId) public view returns (uint256, string memory, uint256, Status, bool) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                return (students[i].id, students[i].name, students[i].age, students[i].status, true);
            }
        }
        
    
        return (0, "", 0, Status.ACTIVE, false);
    }
    
    
    function getAllStudents() public view returns (Student[] memory) {
        return students;
    }
    
    
    function studentExists(uint256 _studentId) public view returns (bool) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                return true;
            }
        }
        return false;
    }
    function getTotalActiveStudents() public view returns (uint256) {
        return totalActiveStudents;
    }
}

