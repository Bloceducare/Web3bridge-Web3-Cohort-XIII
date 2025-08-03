// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../Interfaces/IERC_20.sol";

contract ERC20 is IERC20{
    
    string public name;
    string public symbol;
    uint8 public decimal;
    uint256 public total_Supply;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    constructor(string memory _name, string memory _symbol, uint8 _decimal){
        name =_name;
        symbol = _symbol;
        decimal = _decimal;
    }

    function totalSupply() external view returns(uint256){
        return total_Supply;
        }

    function balanceOf(address owner) external view returns (uint256){
        uint256 balance = balances[owner];
        return balance;
        
    }
     function transfer(address payable _to, uint256 _amount) public returns(bool){
        if(balances[msg.sender] >= _amount){
            balances[msg.sender] -= _amount;
            balances[_to] += _amount;
            emit Transfer(msg.sender, _to, _amount);
            return true;
        }
        revert ("Invalid transaction");
     }
     function transferFrom(address payable _to, address _from, uint256 _amount) external returns(bool){
        if(balances[msg.sender] >= _amount){
          allowances[_from][msg.sender] -= _amount;
          balances[msg.sender] -= _amount;
          balances[_to]+= _amount;
          emit Transfer(_to, _from, _amount);
          return true;
       }
           revert ("transaction not approved");
     }

     function approve(address _spender, uint256 _amount) public returns(bool){
        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
     }
     function allowance(address _from, address _spender) external view returns (uint256){
        uint allow = allowances[_from][_spender];
        return allow;
     }
}