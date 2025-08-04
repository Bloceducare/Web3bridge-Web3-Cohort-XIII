// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {

    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);


    function transfer(address recipient, uint amount) external returns (bool success);

    function approve(address _spender, uint _amount) external returns (bool success);
    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool success);

    function mint(uint amount) external;

    function burn(uint amount) external;
}