// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./IERC20.sol";
contract ERC20 is IERC20{
  uint private _totalSupply;
  mapping (address=>uint) private  balance;
  mapping (address=>mapping(address=>uint))private allowances;
  string public name="Test";
  string public symbol="TEST";
  uint public decimals=18;
 
  function transfer(address recipient,uint amount)external returns (bool) {
    require(balance[msg.sender]>=amount,"Insufficient balance");
    balance[msg.sender]-=amount;
    balance[recipient]+=amount;
    emit Transfer(msg.sender,recipient,amount);
    return true;
  }
  function approve(address spender,uint amount) external  returns (bool){
    require(balance[msg.sender]>=amount,"Insufficient balance");
    allowances[msg.sender][spender]=amount;
    emit Approval(msg.sender, spender,  amount);
    return true;
  }
  function allowance (address owner,address spender) external view returns(uint){
    return allowances[owner][spender];
  }
  function balanceOf(address _address) external view returns(uint){
    return balance[_address];
  }
  function totalSupply()external view returns (uint){
    return _totalSupply;
  }
  function transferFrom(address owner,address recipient,uint amount)external returns(bool) {
      require(balance[owner]>=amount,"Insufficient balance");
      require(allowances[owner][msg.sender]>=amount,"Allowance exceeded");
      allowances[owner][msg.sender]-=amount;
      balance[owner]-=amount;
      balance[recipient]+=amount;
      emit Transfer(owner, recipient, amount);
      return true;
  }
  function mint(uint amount)external returns(bool){
    require(amount>0,"Amount should be greater than 0");
    balance[msg.sender]+=amount;
    _totalSupply+=amount;
    emit Transfer(address(0),msg.sender,amount);
   return true;
  }
  function burn(uint amount)external returns(bool){
    require(amount>0,"Amount should be greater than 0");
    balance[msg.sender]-=amount;
    _totalSupply-=amount;
    emit Transfer(msg.sender,address(0),amount);
    return true;
  }
}
