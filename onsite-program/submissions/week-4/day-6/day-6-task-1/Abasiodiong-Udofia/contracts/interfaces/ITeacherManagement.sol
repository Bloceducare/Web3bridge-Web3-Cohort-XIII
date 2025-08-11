// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITeacherManagement {
    enum UserType { MENTOR, ADMIN, SECURITY }

    struct User {
        uint256 id;
        string name;
        UserType userType;
        bool isEmployed;
        uint256 agreedSalary;
        uint256 totalPaid;
        bool exists;
    }

    event UserRegistered(address indexed userAddress, uint256 id, string name, UserType userType, uint256 agreedSalary);
    event SalaryDisbursed(address indexed userAddress, uint256 id, uint256 amount);
    event UserUpdated(address indexed userAddress, uint256 id, string name, uint256 agreedSalary);
    event UserTerminated(address indexed userAddress, uint256 id);

    function registerUser(string memory _name, UserType _userType, uint256 _agreedSalary) external;
    function updateUser(uint256 _id, string memory _name, uint256 _agreedSalary) external;
    function terminateUser(uint256 _id) external;
    function disburseSalary(uint256 _id, uint256 _amount) external payable;
    function getUser(uint256 _id) external view returns (User memory);
    function getUsersByType(UserType _userType) external view returns (uint256[] memory);
    function getAllUsers() external view returns (uint256[] memory);
}