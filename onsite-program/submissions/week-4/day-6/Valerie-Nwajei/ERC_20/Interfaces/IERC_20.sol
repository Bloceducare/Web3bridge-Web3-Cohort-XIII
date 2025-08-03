// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
     function name() external view returns(string memory);
     function symbol() external view returns(string memory);
     function decimal() external view returns (uint8);
     function totalSupply()external view returns (uint256);
     function balanceOf(address owner) external view returns (uint256);
     function transfer(address payable _to, uint256 _amount) external returns(bool);
     function transferFrom(address payable _to, address _sender, uint256 _amount) external returns(bool);
     function approve(address _spender, uint256 _amount) external returns(bool);
     function allowance(address _from, address _spender) external view returns (uint256);  
     event Transfer(address indexed _to, address indexed _from, uint256 amount);
    event Approval(address indexed _from, address indexed _spender, uint256 amount);
 
}