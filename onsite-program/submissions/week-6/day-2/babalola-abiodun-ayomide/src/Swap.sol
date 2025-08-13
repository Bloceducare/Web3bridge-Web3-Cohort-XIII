// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../src/IERC20.sol";

contract Swap {
    IERC20Permit public immutable _token;

    constructor(address tokenAddress) {
        _token = IERC20Permit(tokenAddress);
    }
    function deposit(uint amount) public{
        _token.transferFrom(msg.sender,address(this), amount);
    }
    function depositWithPermit(uint amount, uint deadline, uint v, bytes32 r, bytes32 s)external{
        _token.permit(msg.sender,address(this), amount, deadline, v,r,s);
        _token.transferFrom(msg.sender,address(this),amount);
    }
}
