// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "./IERC20.sol";

error INSUFFICIENT_BALANCE();
error ALLOWANCE_EXCEEDED();

contract WEB3B is IERC20 {

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    string public name;
    string public symbol;
    uint8 public decimals;
    address public owner;
    
    constructor (string memory _name, string memory _symbol,  uint8 _decimals, uint _totalSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        balanceOf[msg.sender] = _totalSupply;
        owner = msg.sender;
    }
    
    function transfer(address recipient, uint amount) external returns(bool) {
        if (balanceOf[msg.sender] >= amount) {
            balanceOf[msg.sender] -= amount;
            balanceOf[recipient] += amount;
            emit Transfer(msg.sender, recipient, amount);
            return true;
        }
        revert INSUFFICIENT_BALANCE();
    }


    function approve(address spender, uint256 amount) external returns(bool) {

            allowance[msg.sender][spender] = amount;
            emit Approval(msg.sender, spender, amount);
            return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns(bool) {
        // require(balanceOf[msg.sender] >= amount, "Insufficient Balance")
        // require(allowance[msg.sender][spender] <= amount, "Allowance exceeded")

        if (balanceOf[msg.sender] >= amount && allowance[msg.sender][sender] >= amount) {

            allowance[sender][msg.sender] -= amount;
            balanceOf[sender] -= amount;
            balanceOf[recipient] += amount;
            emit Transfer(sender, recipient, amount);
            return true;
        }
        revert ALLOWANCE_EXCEEDED();
    }
    
}