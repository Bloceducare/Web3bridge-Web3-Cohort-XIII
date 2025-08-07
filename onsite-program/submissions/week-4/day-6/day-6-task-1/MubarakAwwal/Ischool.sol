// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;
interface IPayroll {
    error AlreadyEmployed();
    error StaffNotFound();
    enum EmploymentStatus{Employed,Unemployed,Probation}
    struct StaffData{
        address account;
        string name;
        string role;
        uint salary;
        EmploymentStatus status;
    }
    function registerStaff(address _account,string memory _name,string memory _role, uint _salary)external;
    function updateStaff(address _account, uint newSalary)external;
    function payStaff(address payable  _account, uint _amount)external payable  ;
    function checkStatus(address _account)external view returns(string memory);
    function checkBalance(address _account)external view returns(uint);
    function checkPaymentStatus(address _account)external view returns(bool);
    function getStaff(address _account)external view returns(string memory,string memory,uint);
    function getAllStaffs()external view returns(address[] memory);
    function deleteStaff(address _account)external ;

}
