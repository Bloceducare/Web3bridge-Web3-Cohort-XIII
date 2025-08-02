//SPDX-License-Identifier: MIT


pragma solidity  ^0.8.28;


interface IEmployee {
    function get_balance(address _user) external view returns(uint256);
    function transfer_to_employee(address _to, uint256 _amount) external returns(bool);
    function transferFrom(address _from, address _to, uint256 _amount) external returns(bool);
    function emergency_withdraw() external returns(bool);
}