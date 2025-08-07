// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../library/Errors.sol";
import "../interfaces/IERC20Token.sol";

contract Child is IERC20Token {
    string name = "Asset";
    string symbol = "AST";
    uint8 decimals = 18;
    uint256 totalSupply = 5000e18;

    address owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address from, address to, uint256 value);
    event Approval(address owner, address spender, uint256 value
    );

    constructor() {
        owner = msg.sender;
        balanceOf[msg.sender] = 5000e18;
    }

    receive() external payable {}

    fallback() external {}

    function transfer(address _to, uint256 _value) public {
        if (balanceOf[msg.sender] < _value) {
            revert Errors.InsufficientBalance();
        }
        if (owner != msg.sender) {
            revert Errors.Unauthorized();
        }

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
    }

    function transferFrom(address from, address to, uint256 value) external {
        if (balanceOf[from] < value) {
            revert Errors.InsufficientBalance();
        }
        if (allowance[from][msg.sender] < value) {
            revert Errors.NotAllow();
        }
        if (from != address(0) || to != address(0)) {
            revert Errors.InvalidAddress();
        }

        balanceOf[from] -= value; // deduct value from sender
        balanceOf[to] += value; // add value to receiver
        allowance[from][msg.sender] -= value; // allow current user to send value to anither address
    }

    function approve(address _spender, uint256 _value) public {
        if (_value > balanceOf[msg.sender]) {
            revert Errors.InsufficientBalance();
        }
        if (owner != msg.sender) {
            revert Errors.Unauthorized();
        }
        if (_spender == address(0)) {
            revert Errors.InvalidAddress();
        }
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getbalance() external view returns (uint256) {
        return balanceOf[msg.sender];
    } // balance of interacting user

    function getTokenDetails() public view returns (string memory, string memory, uint8, uint256)  {
        return (name, symbol, decimals, totalSupply);
    }
}
