// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TMS} from "./TMS.sol";
contract TMSFactory {
    TMS[] public tmsContracts;

    event TMSCreated(address indexed tmsAddress);

    function createTMS() external {
        TMS newTMS = new TMS{value: msg.value}();
        tmsContracts.push(newTMS);

        emit TMSCreated(address(newTMS));
    }

    function getAllTMSContracts() external view returns (TMS[] memory) {
        return tmsContracts;
    }

    function getTMSContract_by_Index(uint256 index) external view returns (TMS) {
        require(index <tmsContracts.length, "Index out of bounds");
        return tmsContracts[index];
    }
    function getTMSCount() external view returns (uint256) {
        return tmsContracts.length;
    }
}