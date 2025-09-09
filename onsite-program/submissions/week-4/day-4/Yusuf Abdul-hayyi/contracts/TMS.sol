//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
 
import {ITMS} from "./ITMS.sol";


contract TMS is ITMS {
   
   Staff[] public staff;
   mapping(address => Staff) public address_to_staff;
   
   function register_staff(address payable _account, string memory _name, uint256 _amount, Status _status, EmployeeRole _role) external override payable {
      require(address_to_staff[_account].account == address(0), "Staff already registered");
      if (_status == Status.Employed) {
        (bool sent, ) = payable (_account).call{value: _amount}("");
        require(sent, "Payment failed");
    } else {
        revert("Not active staff");
    }

      Staff memory _new_Staff = Staff(_account, _name, _amount, _status, _role);
      staff.push(_new_Staff);
      address_to_staff[_account] = _new_Staff;
   }

}