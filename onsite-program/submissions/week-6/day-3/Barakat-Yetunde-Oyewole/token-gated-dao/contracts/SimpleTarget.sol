// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleTarget {
    uint256 public value;
    bool public executed;
    
    function setValue(uint256 _value) external {
        value = _value;
        executed = true;
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function isExecuted() external view returns (bool) {
        return executed;
    }
}
