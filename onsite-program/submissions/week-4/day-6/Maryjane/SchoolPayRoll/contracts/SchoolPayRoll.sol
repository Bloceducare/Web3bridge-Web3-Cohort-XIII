// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interface/SchoolInterface.sol";
import "../Error/error"

contract SchoolPayRoll is SchoolInterface {
    address public admin;

    mapping(address => Teacher) public teachers;

    function register( address _wallet, uint _id, string memory _name, Status _status,uint _salary)external
    
}
