//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

contract School {
  uint256 public constant schoolFee = 0.006 ether;
  uint256 public nextStudentId = 1;


    struct Student {
        string name;
        uint256 age;
        uint256 id;
        bool hasPaid;
        Status status;
    }
     enum Status { ACTIVE, DEFERRED, RUSTICATED }


    Student[] public students;


function addStudents(string memory _name, uint256 _age) external {
    students.push(Student({
        name: _name,
        age: _age,
        id: nextStudentId,
        hasPaid: false,
        status: Status.ACTIVE
    }));
    
    nextStudentId++;
}

    
    
  function updateStudent(string memory _name, uint256 _age, uint256 _id) external  {
      for (uint256 i = 0; i < students.length; i++){
        if (students[i].id == _id) { 
            students[i].name = _name;
            students[i].age = _age;
        }
      }
  }

  function deleteStudent(uint256 _id) external {
    for(uint256 i =0; i < students.length; i++){
      if ( students[i].id == _id){
        delete students[i];
      }
    }
  } 

 function manageStudent(uint256 _id, uint256 _switchStatus) external {
    for(uint256 i = 0; i < students.length; i++){
        if (students[i].id == _id){
          if( _switchStatus > 1)
            students[i].status = Status.RUSTICATED;  
        }
        else students[i].status = Status.DEFERRED;  
    }
}

    function paySchoolFees(uint256 _id) external payable {

    }
}