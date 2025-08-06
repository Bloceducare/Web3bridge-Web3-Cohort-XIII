// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20Token} from "../Interfaces/IERC20Tken.sol";

contract ERC20Token is IERC20Token {

    error INVALID_ADDRESS();
    error INSUFFICIENT_BALANCE();
    error INSUFFICIENT_ALLOWANCE();

    uint public totalSupply;
    string public name;
    string public symbol;
    uint public decimals;
    address public owner;

    mapping(address => uint) public balances;
    mapping(address => mapping(address => uint)) public _allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);


    constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _address) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
        owner = _address;

    }

    function balanceOf(address _account) external view returns (uint256) {
        if (_account == address(0)) revert INVALID_ADDRESS();
        return balances[_account];
    }

    function transfer(address _to, uint256 _amount) external returns (bool) {
        if (_to == address(0)) revert INVALID_ADDRESS();
        if (balances[msg.sender] < _amount) revert INSUFFICIENT_BALANCE();

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        emit Transfer(msg.sender, _to, _amount);
        
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowance[owner][spender];
    }

    function approve(address _spender, uint256 _amount) external returns (bool) {
        _allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
         
    }

    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool) {
        if (_from == address(0) || _to == address(0)) revert INVALID_ADDRESS();
        if (balances[_from] < _amount) revert INSUFFICIENT_BALANCE();
        if (_allowance[_from][msg.sender] < _amount || _allowance[_from][msg.sender] == 0) revert INSUFFICIENT_ALLOWANCE();
        
        _allowance[_from][msg.sender] -= _amount;
        balances[_from] -= _amount;
        balances[_to] += _amount;

        emit Transfer(_from, _to, _amount);
        return true;
    }

}