// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EMS.sol";

contract EMSFactory{
    EMS public instance;

    constructor(){
        instance = new EMS();
    }

    function getManager()external view returns(address){
        return instance.manager();
    }
}