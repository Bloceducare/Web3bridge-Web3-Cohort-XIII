// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SMS {
    enum Status {
        ACTIVE, 
        DEFERRED, 
        RUSTICATED
    }
    struct Student {
        uint256 id; 
        string name; 
        uint256 age; 
        string gender; 
        Status status; 
    }

    address internal admin;

    constructor(address _admin) {
        admin = _admin; 
    }


    // Student[] internal allStudents;

    uint256 internal uid;

    mapping(address => Student[]) internal students;

    error INDEX_OUT_OF_RANGE(); 

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not allowed to perform this action"); 
        _; 
    }


    function createStudentInfo(address _account, string memory _name, uint256 _age, string memory _gender) external onlyAdmin {
        uid = uid + 1; 
        Student memory newStudent = Student({
            id: uid,
            name: _name,
            age: _age,
            gender: _gender,
            status: Status.ACTIVE
        }); 
        // allStudents.push(newStudent);
        students[_account].push(newStudent);   
    }

    function updateStudentInfo(address _account, uint256 _index, string memory _name, uint _age) external onlyAdmin {
        Student[] storage updateStudent = students[_account]; 
        updateStudent[_index].name = _name; 
        updateStudent[_index].age = _age; 
    }

    function updateStudentStatus(address _account, uint256 _index, Status newStatus) external onlyAdmin  {
        if (_index >= students[_account].length) {
            revert INDEX_OUT_OF_RANGE(); 
        }
        Student[] storage student = students[_account];
        student[_index].status = newStatus; 
    }

    function deleteStudentInfo(address _account, uint256 _index) external onlyAdmin {
        if (_index >= students[_account].length) {
            revert INDEX_OUT_OF_RANGE(); 
        }
        students[_account][_index] = students[_account][students[_account].length - 1]; 
        students[_account].pop(); 
    }

    function getAllStudentInfo(address _account) external view onlyAdmin returns (Student[] memory) {
        return students[_account];  
    }

    function getSingleStudentInfo(address _account, uint256 _index) external view onlyAdmin returns (
        uint256, string memory, uint256, string memory, Status
    ) {
        if (_index >= students[_account].length) {
            revert INDEX_OUT_OF_RANGE(); 
        }
        Student memory student = students[_account][_index]; 
        return (student.id, student.name, student.age, student.gender, student.status); 
    }
}