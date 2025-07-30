// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract SchoolManagementSystem {
    Student[] internal s_students;
    uint256 private nextStudentId = 1;

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    enum Sex {
        MALE,
        FEMALE,
        OTHER
    }

    struct Student {
        uint256 id;           
        string name;
        string telephone_number;
        uint8 age;
        Sex sex;
        Status status;
        bool exists;          
    }

    function registerStudent(
        string calldata _name,
        string calldata _telephone_number,
        uint8 _age,
        Sex _sex
    ) external returns(uint256){
        s_students.push(
            Student(
                nextStudentId,    
                _name,
                _telephone_number,
                _age,
                _sex,
                Status.ACTIVE,
                true
            )
        );
        uint256 newStudentID = nextStudentId;
        nextStudentId++;
        return newStudentID;
    }

    function getStudent(uint256 _studentID)
        external
        view
        returns (Student memory)
    {
        int256 index = findStudentIndex(_studentID);
        require(index >= 0, "Student not found");
        return s_students[uint256(index)];
    }

    function changeStudentStatus(
        uint256 _studentID,
        Status _status
    ) external {
        int256 index = findStudentIndex(_studentID);
        require(index >= 0, "Student not found");
        s_students[uint256(index)].status = _status;
    }

    function updateStudent(
        uint256 _studentID,
        string calldata _name,
        string calldata _telephone_number,
        uint8 _age,
        Sex _sex
    ) external {
        int256 index = findStudentIndex(_studentID);
        require(index >= 0, "Student not found");
        
        Student storage student = s_students[uint256(index)];
        student.name = _name;
        student.telephone_number = _telephone_number;
        student.age = _age;
        student.sex = _sex;
    }

    function deleteStudent(uint256 _studentID) external {
        int256 index = findStudentIndex(_studentID);
        require(index >= 0, "Student not found");
        s_students[uint256(index)].exists = false;
    }

    
    function getAllStudents() external view returns (Student[] memory) {
        return s_students;
    }

    function getAllActiveStudents() external view returns (Student[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < s_students.length; i++) {
            if (s_students[i].exists) {
                activeCount++;
            }
        }
        
        Student[] memory activeStudents = new Student[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < s_students.length; i++) {
            if (s_students[i].exists) {
                activeStudents[currentIndex] = s_students[i];
                currentIndex++;
            }
        }
        
        return activeStudents;
    }

    function findStudentIndex(uint256 _studentID) private view returns (int256) {
        for (uint256 i = 0; i < s_students.length; i++) {
            if (s_students[i].id == _studentID && s_students[i].exists) {
                return int256(i);
            }
        }
        return -1;
    }
}