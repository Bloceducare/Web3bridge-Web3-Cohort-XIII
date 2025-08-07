// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Smanagement.sol";

contract SmanagementFactory {
    // Array to store all deployed Smanagement contract addresses
    address[] public allSmanagements;

    // Event emitted when a new Smanagement contract is created
    event SmanagementCreated(address indexed contractAddress, address indexed creator);

    /// @notice Deploys a new Smanagement contract
    function createSmanagement() external returns (address) {
        Smanagement sm = new Smanagement();
        allSmanagements.push(address(sm));
        emit SmanagementCreated(address(sm), msg.sender);
        return address(sm);
    }

    /// @notice Returns all deployed Smanagement contract addresses
    function getAllSmanagements() external view returns (address[] memory) {
        return allSmanagements;
    }
}