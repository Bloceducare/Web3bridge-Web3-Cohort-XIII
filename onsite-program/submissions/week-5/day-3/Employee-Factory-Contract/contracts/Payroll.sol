// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./IPayroll.sol";

contract payroll is IPayroll{

address payable owner;

constructor()payable  {
    owner =payable(msg.sender);
}
 
 mapping(address=>StaffData) staffs;
 mapping(address=>bool)isPaid;
 address[]ListOfStaffs;
 function registerStaff(address _account, string memory _name, string memory _role,uint _salary )external {
    StaffData memory newStaff=StaffData(_account,_name,_role,_salary,EmploymentStatus.Employed);
    staffs[_account]=newStaff;
    if(newStaff.status==EmploymentStatus.Employed){
        ListOfStaffs.push(_account);
        return;
    }
    revert AlreadyEmployed();
 }
 function updateStaff(address _account, uint newSalary) external {
    staffs[_account].salary=newSalary;
 }
 function payStaff(address payable  _account, uint _amount)external payable  {
     StaffData memory pay=staffs[_account];
     if(pay.status==EmploymentStatus.Employed && _amount==pay.salary){
        _account.transfer(_amount);
        isPaid[_account]=true;
     }
 }
 function checkBalance(address _account)external view returns(uint){
    return _account.balance;
 }
 function checkStatus(address _account)external view returns(string memory){
    StaffData memory getStaffs=staffs[_account];
    if(getStaffs.status==EmploymentStatus.Employed)return "Employed";
    if(getStaffs.status==EmploymentStatus.Unemployed)return "Unemployed";
    if(getStaffs.status==EmploymentStatus.Probation)return "Probation";

    return "Unknown";

 }
function checkPaymentStatus(address _account)external view returns(bool){
    if(isPaid[_account]){
        return true;
    }
    return false;
}
 function getStaff(address _account)external view returns(string memory,string memory,uint){
    StaffData memory staff=staffs[_account];
   return (staff.name,staff.role,staff.salary);
 }
 function getAllStaffs()external view returns(address[]memory){
    return ListOfStaffs;
 }
function deleteStaff(address _account)external {
     for(uint i=0; i<ListOfStaffs.length;i++){
      if(ListOfStaffs[i]==_account){
        ListOfStaffs[i]=ListOfStaffs[ListOfStaffs.length-1];
        ListOfStaffs.pop();
        delete staffs[_account];
        return;
      }

     }
     revert StaffNotFound();
}

}