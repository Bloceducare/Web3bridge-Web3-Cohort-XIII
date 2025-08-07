// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IERC20 {

       function transfer(address recipient, uint amount)external returns(bool);
       function approve(address spender,uint amount)external returns(bool);
       function allowance(address owner,address spender) external  returns(uint);
       function balanceOf(address _address)external  returns(uint);
       function transferFrom(address sender,address recipient, uint amount) external returns (bool);
       function totalSupply()external view returns(uint);
       event Transfer(address indexed sender, address indexed recipient , uint amount);
       event Approval(address indexed owner, address indexed  recipient, uint amount);

}
