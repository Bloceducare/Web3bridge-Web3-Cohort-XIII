// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./StudentTracking.sol";

contract FactoryStudentTracking{

    address [] allContracts;

    function createContracts() external{
        StudentTracking studentTracking = new StudentTracking();
        allContracts.push(address(studentTracking));

    }

    function getContracts()external view returns(address[] memory){
        return allContracts;
    }
}