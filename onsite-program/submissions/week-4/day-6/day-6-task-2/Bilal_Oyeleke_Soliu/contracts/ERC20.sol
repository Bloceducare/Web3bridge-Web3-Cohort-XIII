// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20.sol";
import "../libraries/LERC20.sol";

contract ERC20Token is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    address public owner;
    uint public totalSupply;
    mapping(address => uint) public balances;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, address _owner) { // Changed to uint8
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = _owner;
    }

    using LERC20 for * ;


    function mint(address _to, uint _amount) public {
        if (msg.sender != owner) {
            revert LERC20.ONLY_OWNER_CAN_CALL_THIS_FUNCTION();
        }
        totalSupply += _amount;
        balances[_to] += _amount;
        emit Transfer(address(0), _to, _amount); 
    }

    function burn(uint _amount) public {
        if (owner != msg.sender) {
            revert LERC20.ONLY_OWNER_CAN_CALL_THIS_FUNCTION();
        }
        totalSupply -= _amount;
        balances[owner] -= _amount;
        emit Transfer(owner, address(0), _amount); 
    }

    function _totalSupply() view external returns (uint) {
        return totalSupply;
    }

    function balanceOf(address account) external view returns(uint) {
        return balances[account];
    }

    function transfer(address _to, uint _amount) external returns (bool) {
        if (balances[msg.sender] <= _amount) {
            revert LERC20.NOT_ENOUGH_FUND();
        }
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);

        return true;
    }

    mapping (address => mapping(address => uint)) allowances;

    function approve(address _spender, uint _amount) external returns(bool) {
        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint) {
        return allowances[_owner][_spender];
    }

    function transferFrom(address _from, address _to, uint _amount) public returns (bool) {
        if (balances[_from] <= _amount) {
            revert LERC20.NOT_ENOUGH_FUND();
        }

        if (allowances[_from][msg.sender] <= _amount) {
            revert LERC20.ALLOWANCE_TOO_LOW();
        }

        balances[_from] -= _amount;
        balances[_to] += _amount;
        allowances[_from][msg.sender] -= _amount;

        emit Transfer(_from, _to, _amount);

        return true;
    }
}