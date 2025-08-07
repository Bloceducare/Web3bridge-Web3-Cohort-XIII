// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./AccessControl.sol";

contract AccessControlFactory {
    address[] public accessControlContracts;

    event AccessControlCreated(address indexed newContract, address indexed owner);

    function createAccessControl() external returns (address) {
        AccessControl newAccessControl = new AccessControl();
        accessControlContracts.push(address(newAccessControl));

        emit AccessControlCreated(address(newAccessControl), msg.sender);

        return address(newAccessControl);
    }

    function getAllAccessControlContracts() external view returns (address[] memory) {
        return accessControlContracts;
    }
    // https://sepolia-blockscout.lisk.com/address/0x428CFCD0Ad7cA8307510577A344f2dBb5b957911#code
}
