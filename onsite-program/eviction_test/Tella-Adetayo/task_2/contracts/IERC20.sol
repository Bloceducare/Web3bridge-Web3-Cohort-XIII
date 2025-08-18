// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
    function approve(address sender, uint amount) external returns (bool); 
    function transfer(address recipient, uint amount) external returns (bool); 
    function transferFrom(address sender, address recipient) external returns (bool); 
    function balanceOf(address account) external view returns (uint256); 
    function allowance(address sender, address recipient) external view returns (uint256);
}