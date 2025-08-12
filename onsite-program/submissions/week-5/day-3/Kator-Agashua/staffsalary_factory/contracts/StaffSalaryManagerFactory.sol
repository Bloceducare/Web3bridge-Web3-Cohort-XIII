// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {StaffSalaryManager} from "./StaffSalaryManager.sol";

contract StaffSalaryManagerFactory {
    StaffSalaryManager[] public staffSalaryManagers;

    function createStaffSalaryManager() external {
        StaffSalaryManager newManager = new StaffSalaryManager();
        staffSalaryManagers.push(newManager);
    }

    function getStaffSalaryManagers()
        external
        view
        returns (StaffSalaryManager[] memory)
    {
        return staffSalaryManagers;
    }
}
