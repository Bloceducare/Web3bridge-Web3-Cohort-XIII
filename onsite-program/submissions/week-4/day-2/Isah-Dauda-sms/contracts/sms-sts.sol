// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract schoolManagementSystem{
    
 
    enum Status{
        ACTIVE, DEFERRED, RUSTICATED
    }

    struct student{
        uint id;
        string name;
        uint age;
        string gender;
        Status status;
    }

    student[] public students;

    uint public unique_id = 0;

    function RegStudent(string memory _name, uint _age, string memory _gender) external{
        student memory new_student_ = student({
            id: unique_id, 
            name: _name,
            age: _age, 
            gender: _gender, 
            status: Status.ACTIVE
            });
        
        students.push(new_student_);
        unique_id++;
        }
    
   
    function Get_Students() public view returns (student[] memory) {
        return students;
    }

    function Update_Students(uint _id, string memory _new_name, uint _new_age) external {
        require(_id < students.length, "Invalid Student Index");
        students[_id].name = _new_name;
        students[_id].age = _new_age;
    
    }

    function updateStatus(uint _id, Status _new_status) external{
        require(_id < students.length, "Invalid Student Index");
        students[_id].status = _new_status;
    }

    function statusCheck(uint _id) external view returns(Status){
        require(_id < students.length, "Invalid Student Index");
        return students[_id].status;
    }
  
    function Delete_Student(uint _id) external {
        require(_id <= students.length, "Invalid Student Index");
        students[_id] = students[students.length - 1];
        students.pop();
    }

    function Get1Student(uint _id) external view returns (student memory) {
        require(_id < students.length, "Invalid Student Index");
        student memory onlyStudent = students[_id];
        return (onlyStudent);
        }
}

//schoolManagementSystem Contract Address - 0xCc07ccE8F6A09C45e92644760aaA8e678C0E3A97