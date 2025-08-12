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
        bool exists; // true if student exists, false if deleted
    }
    
    // Array to store all students
    Student[] public students;
    
    // Counter to give each student a unique ID
    uint256 public nextId = 1;
    
    /**
     * Register a new student
     */
    function registerStudent(string memory _name, uint256 _age) public returns (uint256) {
        // Create a new student
        Student memory newStudent = Student({
            id: nextId,
            name: _name,
            age: _age,
            status: Status.ACTIVE, // New students are always ACTIVE
            exists: true
        });
        
        // Add student to our array
        students.push(newStudent);
        
        // Save the current ID to return
        uint256 currentId = nextId;
        
        // Increase ID for next student
        nextId = nextId + 1;
        
        return currentId;
    }
    
    /**
     * Update student information
     */
    function updateStudent(uint256 _studentId, string memory _newName, uint256 _newAge) public {
        // Find the student in our array
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                // Update the student's information
                students[i].name = _newName;
                students[i].age = _newAge;
                return; // Exit the function once we found and updated
            }
        }
    }
    
    
    function deleteStudent(uint256 _studentId) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                students[i].exists = false;
                return; 
            }
        }
    }
    
    /**
     * Change a student's status
     */
    function changeStudentStatus(uint256 _studentId, Status _newStatus) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                students[i].status = _newStatus;
                return;
            }
        }
    }
    
   
    function getStudent(uint256 _studentId) public view returns (uint256, string memory, uint256, Status) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _studentId && students[i].exists == true) {
                return (students[i].id, students[i].name, students[i].age, students[i].status);
            }
        }
        
    
        return (0, "", 0, Status.ACTIVE);
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
}