// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IPiggyBankFactory {

    function createPiggyAccount() external returns (address);
    
    function getUserAccountsAndBalance(address _user) external view returns (address[] memory, uint256[] memory);
    
    function withdrawAdminFees(address payable _to) external;
    
    function getTotalAccounts() external view returns (uint256);
}
