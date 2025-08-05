// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IERC20.sol";

contract ERC20 is IERC20 {
    uint public totalSupply;
    string public name = "Simon's Token";
    string public symbol = "SOTOK";
    uint8 public decimals = 18;
    address public owner;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    constructor() {
        owner = msg.sender;
    }

    function transfer(address recipient, uint amount) external returns (bool success) {
        require(balanceOf[msg.sender] >= amount, "ERC20: insufficient balance");
        require(recipient != address(0), "ERC20: transfer to zero address");

        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) external returns (bool success) {
        require(spender != address(0), "ERC20: approve to zero address");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool success) {
        require(allowance[sender][msg.sender] >= amount, "ERC20: allowance exceeded");
        require(balanceOf[sender] >= amount, "ERC20: insufficient balance");
        require(recipient != address(0), "ERC20: transfer to zero address");

        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }

    function mint(uint amount) external {
        require(msg.sender == owner, "ERC20: only owner can mint");
        require(amount > 0, "ERC20: cannot mint 0");

        balanceOf[msg.sender] += amount;
        totalSupply += amount;

        emit Transfer(address(0), msg.sender, amount);
    }

    function burn(uint amount) external {
        require(balanceOf[msg.sender] >= amount, "ERC20: burn amount exceeds balance");

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        emit Transfer(msg.sender, address(0), amount);
    }
}
