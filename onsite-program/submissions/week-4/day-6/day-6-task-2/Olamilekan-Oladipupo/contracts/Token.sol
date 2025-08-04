// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import   "../interfaces/InterfaceErc20.sol";

error CAN_NOT_APPROVE_ABOVE_BALANCE();
error NOT_ENOUGH_BALANCE();


contract Token is IERC20 {
    string public constant name = "Token";
    string public constant symbol = "Tk";
    uint8 public constant decimals = 2;
    uint256 constant _totalSupply = 2100000000;

    mapping (address => uint256) balance;
    mapping (address => mapping (address => uint256)) _allowance;





  
    function totalSupply() external pure returns (uint256){
        return _totalSupply;
    }

    
    function balanceOf(address account) external view returns (uint256){
        return balance[account];

    }

   
    function transfer(address to, uint256 value) external returns (bool){
        require(balance[msg.sender] >= value, NOT_ENOUGH_BALANCE());
        if (balance[msg.sender] >= value){
            balance[msg.sender] -= value;
            balance[to] += value;
            emit Transfer(msg.sender, to, value);

            return true;
        }
        return false;
            
        
    }


   
    function allowance(address owner, address spender) external view returns (uint256){
        return _allowance[owner][spender];
    
    }

    function approve(address spender, uint256 value) external returns (bool){
        require(balance[msg.sender] >= value, CAN_NOT_APPROVE_ABOVE_BALANCE());
        _allowance[msg.sender][spender] += value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

   
    function transferFrom(address from, address to, uint256 value) external returns (bool){
        if (this.allowance(from, msg.sender) >= value){
           if (balance[from] >= value){
            _allowance[from][msg.sender] -=value;
            balance[from] -=value;
            balance[to] +=value;
            emit Transfer(from, to, value);
            return true;
           }
           return false;
        }
        else return false;

    }

    function buyToken(uint256 value)external {
        if (balance[msg.sender] > 0){
            balance[msg.sender] += value;
            emit Transfer(msg.sender, msg.sender, balance[msg.sender]);
            return;
        }
        balance[msg.sender] = value;
    }

}

