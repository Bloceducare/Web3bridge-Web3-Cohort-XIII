// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "../interfaces/IErc20.sol";

error INSUFFICIENT_BALANCE();
error INSUFFICIENT_ALLOWANCE();

contract Erc20 is IErc20{
    uint256 _totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;
    string name = "MyTokem";
    string symbol = "TESTTOKEN";
    uint256 decimals = 18;

    constructor(uint256 _initialAmount){
        balances[msg.sender] = _initialAmount;
        _totalSupply = _initialAmount;
     }


     function totalSupply()external view returns(uint256){
        return _totalSupply;
     }

    function transfer(address recipient,uint256 amount) external returns (bool){
        require(balances[msg.sender] >= amount,INSUFFICIENT_BALANCE());
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool){
        require(balances[msg.sender] >= amount,INSUFFICIENT_BALANCE());
        allowed[msg.sender][spender] = amount;
        return true;
    }

    function balanceOf(address account) external view returns (uint256){
        return balances[account];
    }

    function transferFrom(address sender,address recipient,uint256 amount) external returns (bool){
        require(balances[sender] >= amount,INSUFFICIENT_BALANCE());
        require(allowed[sender][msg.sender] >= amount,INSUFFICIENT_ALLOWANCE());
        allowed[sender][msg.sender] -= amount;
        balances[sender] -= amount;
        balances[recipient] +=amount;
        return true;
    }

    function allowance(address owner,address spender)external view returns(uint256){
        return allowed[owner][spender];
    }

}