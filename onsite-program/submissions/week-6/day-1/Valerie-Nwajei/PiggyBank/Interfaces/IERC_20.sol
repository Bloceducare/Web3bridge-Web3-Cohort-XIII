// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address _to, uint256 _amount) external returns (bool);

    event Transfer(address indexed _to, address indexed _from, uint256 amount);
    event Approval(
        address indexed _from,
        address indexed _spender,
        uint256 amount
    );
}
