// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../library/Errors.sol";
import "../interfaces/IERC20Token.sol";

contract ERC20Token is IERC20Token {
    string public name = "Asset";
    string public symbol = "AST";
    uint8 public decimals = 18;
    uint256 private _totalSupply = 5000e18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        balanceOf[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    receive() external payable {}
    fallback() external {}

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function transfer(address _to, uint256 _value) public {
        if (_to == address(0)) revert Errors.InvalidAddress();
        if (balanceOf[msg.sender] < _value) revert Errors.InsufficientBalance();

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
    }

    function approve(address _spender, uint256 _value) public {
        if (_spender == address(0)) revert Errors.InvalidAddress();

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
    }

    function transferFrom(address from, address to, uint256 value) public {
        if (from == address(0) || to == address(0)) revert Errors.InvalidAddress();
        if (balanceOf[from] < value) revert Errors.InsufficientBalance();
        if (allowance[from][msg.sender] < value) revert Errors.NotAllow();

        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;

        emit Transfer(from, to, value);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getbalance() external view returns (uint256) {
        return balanceOf[msg.sender];
    }

    function getTokenDetails() public view returns (
        string memory, string memory, uint8, uint256
    ) {
        return (name, symbol, decimals, _totalSupply);
    }
}
