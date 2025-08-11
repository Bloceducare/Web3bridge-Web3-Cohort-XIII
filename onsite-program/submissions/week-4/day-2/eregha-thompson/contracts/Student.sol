// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract studentManagement {
     enum Status { ACTIVE, DEFERRED, RUSTICATED }
     enum Gender {MALE, FEMALE}
    struct Student{
        string name;
        uint age;
        Gender gender;
        uint UID;
        Status status;
    }

   
    Student[] private pupils;
    uint private UID = 100;

    modifier checkIndex(uint index){
        require(index< pupils.length, "invalid");
        _;
    }


    function newStudent(string memory _name, uint _age, Gender _gender, Status _status) external   {
        uint newUID = UID++;
        pupils.push(Student(_name, _age, _gender, newUID,_status ));
    
    }
    

    function updateName(uint index, string memory _name) external checkIndex(index) {
      
        pupils[index].name = _name;
        
    }
    function updateAge(uint index, uint _age) external checkIndex(index) {
        pupils[index].age = _age;
    }
    function updateGender(uint index, Gender _gender) external checkIndex(index) {
        pupils[index].gender = _gender;
    } 
    function updateStatus(uint index , Status _status) external checkIndex(index){
        
        pupils[index].status = _status;
    }
    function getStudent(uint index) external view returns (string memory, uint, uint, Gender, Status) {
        Student memory pupil = pupils[index];
        
        return (pupil.name, pupil.age, pupil.UID, pupil.gender, pupil.status);
    }

    function getStudents() external view returns (Student[] memory) {
        return pupils;
    }

    function deleteStudent(uint index)  external  checkIndex(index){
        
        delete pupils[index];
    }


}