//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
 
import {ITMS} from "../interfaces/ITMS.sol";

error AlreadyRegistered();
error StaffNotFound();
error NotElligible();

contract TMS is  ITMS {
   Staff[] public staff;
   mapping(address => Staff) public address_to_staff;
   address payable owner;

   constructor() payable {
      owner = payable(msg.sender);
   }
   
   function register_staff(address _account, string memory _name, uint256 _amount, Status _status, EmployeeRole _role) external {
      // require(address_to_staff[_account].account == address(0), "Staff already registered");
      if (address_to_staff[_account].account == address(0)) {
         Staff memory new_Staff_ = Staff(_account, _name, _amount, _status, _role, false);
         staff.push(new_Staff_);
         address_to_staff[_account] = new_Staff_;
         return;
   
      }
      revert AlreadyRegistered();
   }

   function pay_staff(address payable _account) external payable {
         if (address_to_staff[_account].account != address(0) && address_to_staff[_account].status == Status.Employed && address_to_staff[_account].paid == false) {
            _account.transfer(address_to_staff[_account].amount);
            address_to_staff[_account].paid = true;
            return;
         }
         revert NotElligible();
   }

   function check_pay(address payable _account) external view returns (uint) {
      if (address_to_staff[_account].account != address(0)) {
      return address_to_staff[_account].account.balance;
      }
      revert NotElligible();
   }
   function update_staff_salary(address _account, uint256 new_amount) external {
      address_to_staff[_account].amount = new_amount;
      address_to_staff[_account].paid = false;
      
      for (uint i; i < staff.length; i++) 
      {
         if(staff[i].account == _account) {
            staff[i].amount = new_amount;
            return;
         }
      }
      
   }
   function get_all_staff() external view returns(Staff[] memory) {
      return staff;
   }

   function delete_staff(address _account) external {
      for (uint i; i < staff.length; i++) {
         if(staff[i].account == _account) {
            staff[i] = staff[staff.length - 1];
            staff.pop();
            delete address_to_staff[_account];
            return;
         }
      }
      revert StaffNotFound();
   }
}