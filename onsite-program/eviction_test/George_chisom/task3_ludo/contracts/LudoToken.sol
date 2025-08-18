// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ILudoToken.sol";
import "./libraries/LudoErrors.sol";

contract LudoToken is ILudoToken {
    string public name = "Ludo Game Token";
    string public symbol = "LUDO";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    constructor(uint256 _totalSupply) {
        totalSupply = _totalSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        if (_to == address(0)) revert LudoErrors.InvalidAddress();
        if (balanceOf[msg.sender] < _value) revert LudoErrors.InsufficientBalance();

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        if (_to == address(0)) revert LudoErrors.InvalidAddress();
        if (balanceOf[_from] < _value) revert LudoErrors.InsufficientBalance();
        if (allowance[_from][msg.sender] < _value) revert LudoErrors.InsufficientAllowance();

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function mint(address _to, uint256 _amount) public {
        if (_to == address(0)) revert LudoErrors.InvalidAddress();

        totalSupply += _amount;
        balanceOf[_to] += _amount;

        emit Transfer(address(0), _to, _amount);
    }
}
