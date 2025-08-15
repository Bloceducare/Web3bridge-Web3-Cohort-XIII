//SPDX-License-Identifier:MIT
pragma solidity  0.8.30;

contract management_system{
    enum  Status{Active,Rusticated}
    struct Data{
        uint studentId;
        string name;
        uint age;
        string gender;
        Status status;
        
    }
    Data[] students;
    function registerStudent(uint _studentId,string memory _name, uint _age, string memory _gender)external {
        students.push(Data(_studentId,_name,_age,_gender,Status.Active));
      
    }
    function updateStudentData(uint _index, string memory updateName, uint updateAge, string memory updateGender)external{
     require(_index<students.length,"Invalid index");
     students[_index].name=updateName;
     students[_index].age=updateAge;
     students[_index].name=updateGender;

    }
   
    function getOneStudent(uint _index) external view returns(Data memory){
       Data memory oneStudent=students[_index];
       return oneStudent;
    }
    function getAllStudents()external view returns (Data[] memory){
        return students;
    }
    function changeStatus(uint _index,Status _newStatus) external {
        require(_index<students.length,"Invalid index");
        students[_index].status=_newStatus;
       // _newStatus=students[_index].status;
    }
    function checkStudentStatus(uint _index) external view returns(string memory){
        Status statusData=students[_index].status;
        for(uint i=0;i<students.length;i++){
        if (statusData==Status.Active) return "Active";
        if(statusData==Status.Rusticated) return "Rusticated";
        }
     return "Unknown";
        
    }
    function deleteStudent(uint _index) external {
        delete students[_index];
        students[_index].status=Status.Rusticated;
    }
 
}