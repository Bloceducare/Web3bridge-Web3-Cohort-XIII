// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Employeemanagement {
    enum Role { Mentor, Admin, Security }

    struct User {
        Role role;
        uint256 agreedSalary;
        bool isEmployed;
    }

    mapping(address => User) internal users;
    address[] internal userList;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function _parseRole(string memory roleStr) internal pure returns (Role) {
        bytes32 roleHash = keccak256(abi.encodePacked(roleStr));
        if (roleHash == keccak256("Mentor")) return Role.Mentor;
        if (roleHash == keccak256("Admin")) return Role.Admin;
        if (roleHash == keccak256("Security")) return Role.Security;
        revert("Invalid role");
    }

    function _roleToString(Role role) internal pure returns (string memory) {
        if (role == Role.Mentor) return "Mentor";
        if (role == Role.Admin) return "Admin";
        if (role == Role.Security) return "Security";
        return "Unknown";
    }
}
