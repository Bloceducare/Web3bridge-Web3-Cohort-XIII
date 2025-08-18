//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IERC20 {

    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);

}
