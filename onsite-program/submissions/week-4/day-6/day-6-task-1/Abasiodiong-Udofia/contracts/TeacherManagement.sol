// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITeacherManagement.sol";
import "./libraries/Errors.sol";

contract TeacherManagement is ITeacherManagement {
    
    mapping(uint256 => User) private users;
    
    mapping(address => uint256) private addressToId;
    
    mapping(UserType => uint256[]) private usersByType;
    
    uint256[] private allUserIds;
    uint256 private nextId;

    
    function registerUser(string memory _name, UserType _userType, uint256 _agreedSalary) external override {
        if (msg.sender == address(0)) revert Errors.InvalidAddress();
        if (bytes(_name).length == 0) revert Errors.NameCannotBeEmpty();
        if (_agreedSalary == 0) revert Errors.InvalidSalaryAmount();
        if (addressToId[msg.sender] != 0) revert Errors.UserNotFound(addressToId[msg.sender]); // Prevent re-registration

        uint256 userId = nextId;
        users[userId] = User(userId, _name, _userType, true, _agreedSalary, 0, true);
        addressToId[msg.sender] = userId;
        usersByType[_userType].push(userId);
        allUserIds.push(userId);
        nextId++;

        emit UserRegistered(msg.sender, userId, _name, _userType, _agreedSalary);
    }

    
    function updateUser(uint256 _id, string memory _name, uint256 _agreedSalary) external override {
        if (msg.sender == address(0)) revert Errors.InvalidAddress();
        if (!users[_id].exists) revert Errors.UserNotFound(_id);
        if (addressToId[msg.sender] != _id) revert Errors.UserNotFound(_id);
        if (bytes(_name).length == 0) revert Errors.NameCannotBeEmpty();
        if (_agreedSalary == 0) revert Errors.InvalidSalaryAmount();

        User storage user = users[_id];
        user.name = _name;
        user.agreedSalary = _agreedSalary;
        emit UserUpdated(msg.sender, _id, _name, _agreedSalary);
    }

    
    function terminateUser(uint256 _id) external override {
        if (msg.sender == address(0)) revert Errors.InvalidAddress();
        if (!users[_id].exists) revert Errors.UserNotFound(_id);
        if (addressToId[msg.sender] != _id) revert Errors.UserNotFound(_id);

        User storage user = users[_id];
        user.isEmployed = false;
        emit UserTerminated(msg.sender, _id);
    }

    
    function disburseSalary(uint256 _id, uint256 _amount) external payable override {
        if (msg.sender == address(0)) revert Errors.InvalidAddress();
        if (!users[_id].exists) revert Errors.UserNotFound(_id);
        if (!users[_id].isEmployed) revert Errors.UserNotEmployed(_id);
        if (_amount == 0) revert Errors.InvalidSalaryAmount();
        if (_amount > users[_id].agreedSalary) revert Errors.SalaryExceedsAgreedAmount(_amount, users[_id].agreedSalary);
        if (msg.value < _amount) revert Errors.InsufficientBalance(_amount, msg.value);

        User storage user = users[_id];
        user.totalPaid += _amount;

        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");

        emit SalaryDisbursed(msg.sender, _id, _amount);
    }

    function getUser(uint256 _id) external view override returns (User memory) {
        if (!users[_id].exists) revert Errors.UserNotFound(_id);
        return users[_id];
    }

    
    function getUsersByType(UserType _userType) external view override returns (uint256[] memory) {
        uint256[] memory activeUsers = new uint256[](usersByType[_userType].length);
        uint256 count = 0;
        for (uint256 i = 0; i < usersByType[_userType].length; i++) {
            if (users[usersByType[_userType][i]].exists) {
                activeUsers[count] = usersByType[_userType][i];
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeUsers[i];
        }
        return result;
    }

    
    function getAllUsers() external view override returns (uint256[] memory) {
        uint256[] memory activeUsers = new uint256[](allUserIds.length);
        uint256 count = 0;
        for (uint256 i = 0; i < allUserIds.length; i++) {
            if (users[allUserIds[i]].exists) {
                activeUsers[count] = allUserIds[i];
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeUsers[i];
        }
        return result;
    }
}