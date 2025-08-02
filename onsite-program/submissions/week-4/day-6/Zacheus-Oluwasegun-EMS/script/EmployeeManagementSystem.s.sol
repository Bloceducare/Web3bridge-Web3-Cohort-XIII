// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {EmployeeManagementSystem} from "../src/EmployeeManagementSystem.sol";

contract EmployeeManagementScript is Script {
    EmployeeManagementSystem public employeeManagementSystem;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        employeeManagementSystem = new EmployeeManagementSystem();

        vm.stopBroadcast();
    }
}
