//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

contract StudentData {
    enum Status {
        ACTIVE, DEFERRED, RUSTICATED
    }
    struct StudentRecord {
        uint256 id;
        string name;
        uint256 age;
        string course;  
        Status status;
    }


    StudentRecord[] public students;
    uint256 public uniqueId;

    function register_new_student(string memory _name, uint256 _age, string memory _course) public {
        StudentRecord memory newStudent_ = StudentRecord({id: uniqueId, name: _name, age: _age, course: _course, status: Status.ACTIVE});      
        students.push(newStudent_);
        uniqueId++;
        }

    function get_student_by_id(uint256 _id) internal view returns (uint256) {
        for (uint256 i = 0; i < students.length; i++) {
            if (students[i].id == _id){
                return i;
            }
        }
        revert("Student doesn't exist");
    }

    function update_student(uint256 _id, string memory _new_name, uint256 _new_age, string memory _new_course) public {
        require(_id < students.length, "Student doesn't exist");
        uint256 index = get_student_by_id(_id);
        students[index].name = _new_name;
        students[index].age = _new_age;
        students[index].course = _new_course;
    }
    function update_student_status(uint256 _id, Status _new_status) public {
        require(students.length > 0, "No student in the list");
        uint256 index = get_student_by_id(_id);
        students[index].status = _new_status;
    }
    // function deferred() public {
    //     status = Status.DEFERRED;
    // }

    // function rusticated() public {
    //     status = Status.RUSTICATED;
    // }
        
    function delete_student(uint256 _id) public {
        require(_id < students.length, "Student doesn't exist");
        uint256 index = get_student_by_id(_id);
        delete students[index];
    }
    function get_each_student(uint256 _id) public view returns (StudentRecord memory) {
        uint256 index = get_student_by_id(_id);
        return students[index];
    }
    function get_all_student() public view returns (StudentRecord[] memory) {
        return students;
    }
}   