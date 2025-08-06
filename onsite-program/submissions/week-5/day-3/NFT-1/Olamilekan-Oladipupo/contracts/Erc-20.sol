// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import   "../interfaces/InterfaceErc20.sol";

error CAN_NOT_APPROVE_ABOVE_BALANCE();
error NOT_ENOUGH_BALANCE();


contract Token is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public _totalSupply;
    address owner;

    mapping (address => uint256) private balance;
    mapping (address => mapping (address => uint256)) private _allowance;


    constructor (string memory _name, string memory _symbol, uint8 _decimals, 
    uint256 total_supply_, address _owner){
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = total_supply_;
        owner = _owner;
        balance[_owner] = _totalSupply;
    }


  
    function totalSupply() external view returns (uint256){
        return _totalSupply;
    }

    
    function balanceOf(address account) external view returns (uint256){
        return balance[account];

    }

   
    function transfer(address to, uint256 value) external returns (bool){
        if (balance[msg.sender] >= value){
            balance[msg.sender] -= value;
            balance[to] += value;
            emit Transfer(msg.sender, to, value);

            return true;
        }
        return false;
            
        
    }


   
    function allowance(address tokenOwner, address spender) external view returns (uint256){
        return _allowance[tokenOwner][spender];
    
    }

    function approve(address spender, uint256 value) external returns (bool){
        if (balance[msg.sender] >= value){
            _allowance[msg.sender][spender] = value;
            emit Approval(msg.sender, spender, value);
            return true;       
        }
        return false;
        
    }

   
    function transferFrom(address from, address to, uint256 value) external returns (bool){
        if (_allowance[from][msg.sender] >= value){
           if (balance[from] >= value){
            _allowance[from][msg.sender] -=value;
            balance[from] -=value;
            balance[to] +=value;
            emit Transfer(from, to, value);
            return true;
           }
           return false;
        }
        return false;

    }
}