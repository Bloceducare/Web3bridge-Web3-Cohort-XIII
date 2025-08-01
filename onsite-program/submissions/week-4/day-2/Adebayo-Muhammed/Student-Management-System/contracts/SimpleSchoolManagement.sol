// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract SchoolManagement {
    

    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    
    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        bool exists; 
    }
    
    Student[] public students;
    
    uint256 public nextId = 1;
    
    function registerStudent(string memory _name, uint256 _age) public {
        Student memory newStudent = Student({
            id: nextId,
            name: _name,
            age: _age,
            status: Status.ACTIVE, 
            exists: true
        });
        
        students.push(newStudent);
        nextId++;
    }
    
    function updateStudent(uint256 _id, string memory _name, uint256 _age) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _id && students[i].exists) {
                students[i].name = _name;
                students[i].age = _age;
                return;
            }
        }
        revert("Student not found");
    }
    
    function deleteStudent(uint256 _id) public {
        for (uint256 i = 0; i < students.length; i++)
            if (students[i].id == _id && students[i].exists) {
                students[i].exists = false;
                return;
            }
        }
        revert("Student not found");
    }
    
    function changeStatus(uint256 _id, Status _newStatus) public {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _id && students[i].exists) {
                students[i].status = _newStatus;
                return;
            }
        }
        revert("Student not found");
    }
    
    function getStudent(uint256 _id) public view returns (
        uint256 id,
        string memory name,
        uint256 age,
        Status status
    ) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _id && students[i].exists) {
                Student memory student = students[i];
                return (student.id, student.name, student.age, student.status);
            }
        }
        revert("Student not found");
    }
    
    function getAllStudents() public view returns (Student[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].exists) {
                activeCount++;
            }
        }
        
        Student[] memory activeStudents = new Student[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].exists) {
                activeStudents[currentIndex] = students[i];
                currentIndex++;
            }J
        }
        
        return activeStudents;
    }
    
    function getTotalStudents() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].exists) {
                count++;
            }
        }
        return count;
    }
}