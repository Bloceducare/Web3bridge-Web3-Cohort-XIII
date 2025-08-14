// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
interface IErc20 {

    function totalSupply()external view returns(uint256);

    function transfer(address recipient,uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transferFrom(address sender,address recipient,uint256 amount) external returns (bool);

    function allowance(address owner,address spender)external view returns(uint256);

}