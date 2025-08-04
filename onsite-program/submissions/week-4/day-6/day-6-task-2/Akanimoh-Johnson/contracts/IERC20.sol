// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {

    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns(bool);
    function burn(uint256 amount) external;
    function mint(address to, uint256 amount) external;
    function get_total_supply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approve(address indexed owner, address indexed spender, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}