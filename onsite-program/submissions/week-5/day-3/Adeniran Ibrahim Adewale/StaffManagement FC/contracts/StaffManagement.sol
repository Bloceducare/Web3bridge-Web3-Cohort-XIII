// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./Child.sol";

contract StaffManagement {
    Child[] childContracts;

    address admin;
    

    function createChildContract() public {
        require(msg.sender == admin, "Only admin can create child contracts");
        Child newChild = new Child();
        childContracts.push(newChild);
    }
}