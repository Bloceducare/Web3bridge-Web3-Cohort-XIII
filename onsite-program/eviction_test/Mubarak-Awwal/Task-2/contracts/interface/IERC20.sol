//SPDX-License-Identifier:MIT

pragma solidity ^0.8.28;

 interface IERC20{
    function balanceOf(address owner) external view returns(uint balance);
    function approve(address spender, uint amount)external;
 }

