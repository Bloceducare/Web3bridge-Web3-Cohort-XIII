// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./Child.sol";

contract ERC20Token {
    address[] children;

    function createChild() external {
        Child child = new Child();
        children.push(address(child));
    }

    // function create_child(address _owner) external {
    //     _owner = msg.sender;
    //     Child child = new Child(_owner);
    //     children.push(address(child));
    // }
}