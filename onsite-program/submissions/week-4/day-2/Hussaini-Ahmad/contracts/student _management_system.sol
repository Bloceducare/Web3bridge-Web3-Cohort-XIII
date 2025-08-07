// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract StudentManagementSystem{

    uint256 uniqueId = 1;
    struct Student{
        uint256 id;
        string name;
        string course;
        int256 year;
        Status status; 
    }

    enum Status{
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    Student[] students;

    function createStudent(string memory _name,string memory _course,int256 _year) external {
        Student memory new_student = Student({
            id: uniqueId,
            name: _name,
            course: _course,
            year: _year,
            status: Status.ACTIVE
        });

        students.push(new_student);
        uniqueId++;
    }

    function getStudent(uint256 _id) external view returns(Student memory){
        require(_id < students.length,"Student does not exist");
        return students[_id];
    }

    function getAllStudents() external view returns(Student[] memory){
        return students;
    }

    function updateStudent(uint256 _id,string memory _name,string memory _course,int256 _year,Status _status) external{
        require(_id < students.length,"Student does not exist");
        students[_id].name = _name;
        students[_id].course = _course;
        students[_id].year = _year;
        students[_id].status = _status;
    }

    function deleteStudent(uint256 _id) external{
        require(_id < students.length,"Student does not exist");
        delete students[_id];
    }
    
}

