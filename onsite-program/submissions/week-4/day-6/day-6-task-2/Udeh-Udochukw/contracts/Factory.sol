// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.26;

import "./ERC20.sol";

contract Factory{
    address[] children

    function createERC20(address _owner) external{
        _owner = msg.sender;
        ERC20 erc20 = new ERC20(_owner);
        children.push(erc20);
    }

}