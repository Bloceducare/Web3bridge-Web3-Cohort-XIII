// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;



contract StudentTracking{
       enum Status {
         ACTIVE, DEFERRED, RUSTICATED 
    }

    enum Gender {
        MALE,FEMALE
    }

    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
        Gender gender;
}


 Student [] students;
 uint256 private studentId = 1;


 function registerStudents(string memory _name,uint256 _age, Gender _gender )external{
    uint256 newId = studentId++;
    Student memory student = Student({id:newId,name:_name,age:_age,status:Status.ACTIVE,gender:_gender});
    students.push(student);

 }

 modifier validateIndex(uint256 _index){
    require(_index <= students.length,"Invalid_index");
    _;
 }

 function updateStudentName(uint256 _index, string memory _name)external validateIndex(_index) {
 
   students[_index].name = _name;

 }

 function updateStudentAge(uint256 _index,uint256 _age)external validateIndex(_index) {
    students[_index].age = _age;
 }


 function updateStudentNameAndAge(uint256 _index,string memory _name, uint256 _age)external validateIndex(_index){
   students[_index].age = _age;
   students[_index].name = _name;
 }


 function deleteStudent(uint256 _index) external validateIndex(_index){
    delete students[_index];
 }

 function getAllStudents() external view returns(Student [] memory){
    return students;
 }

 function getStudentById(uint256 _index)external view validateIndex(_index)returns(Student memory){
    return students[_index];
 }

 function updateStatus(uint256 _index, Status _newStatus) external validateIndex(_index){
    students[_index].status = _newStatus;
 }




 
}

