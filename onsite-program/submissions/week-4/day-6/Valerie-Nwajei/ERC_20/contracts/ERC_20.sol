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

    constructor(string memory _name, string memory _symbol, uint8 _decimal, uint256 _totalSupply){
        name =_name;
        symbol = _symbol;
        decimal = _decimal;
        total_Supply = _totalSupply;

        balances[msg.sender] = total_Supply;
    }

    function balanceOf(address owner) external view returns (uint256){
        return balances[owner];
        
    }
     function transfer(address _to, uint256 _amount) public returns(bool){
      if(_to == address(0)){
         revert("Invalid address");
      }
        if(balances[msg.sender] >= _amount){
            balances[msg.sender] -= _amount;
            balances[_to] += _amount;
            emit Transfer(msg.sender, _to, _amount);
            return true;
        }
        revert ("Invalid transaction");
     }
     function transferFrom(address payable _from, address _to, uint256 _amount) external returns(bool){
      if(_to == address(0)){
         revert("Invalid address");
      }
      if(_from == address(0)){
         revert("Invalid address");
      }
        if(balances[_from] >= _amount && allowances[_from][msg.sender] >= _amount){
          allowances[_from][msg.sender] -= _amount;
          balances[_from] -= _amount;
          balances[_to]+= _amount;
          emit Transfer(_from, _to, _amount);
          return true;
       }
           revert ("transaction not approved");
     }

     function approve(address _spender, uint256 _amount) public returns(bool){
      if(_spender == address(0)){
         revert("Invalid address");
      }
        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
     }
     function allowance(address _from, address _spender) external view returns (uint256){
      if(_spender == address(0)){
         revert("Invalid address");
      }
      if(_from == address(0)){
         revert("Invalid address");
      }
        uint allow = allowances[_from][_spender];
        return allow;
     }
       function mint(address payable _owner, uint256 _amount) public returns(bool){
        balances[_owner] += _amount;
        total_Supply += _amount;
        emit Transfer(address(0), _owner, _amount);
        return true;
     }

     function totalSupply()external view returns(uint256){
        return total_Supply;
     }
}