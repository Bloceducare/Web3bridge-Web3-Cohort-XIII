// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IERC20 {

    function transfer(address recipient,uint amount)external returns (bool);
    function approve(address spender,uint amount)external returns (bool);
    function transferFrom(address sender,address recipient,uint amount)external returns(bool);
    event Transfer(address indexed from,address indexed to, uint amount);
    event Approval(address indexed owner, address indexed spender,uint amount);

}