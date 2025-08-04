//SPDX -License-Identifier: MIT
pragma solidity ^0.8.28;

error InsufficientBalance();
error InvalidSender();
error InvalidReceiver();
// error InsufficientAllowance;
// error InvalidApprover;
error InvalidSpender();

interface IERC20 {
    function transfer ( address recipient, uint amount) external returns (bool);
     function transferFrom (address sender, address recipient, uint amount) external returns (bool);
    function approve ( address spender, uint amount) external returns (bool);
    function totalSupply () external view returns (uint);
    function balanceOf (address account) external view returns (uint);
    function allowance (address sender, address spender) external returns (uint);
}

contract ERC20 is IERC20 {
    uint private _totalSupply;
    mapping (address=>uint) public _balance;
    mapping(address=> mapping(address=>uint)) public _allowance;
    string public name ="cakeToken";
    string public symbol = "CAKE";
    uint public decimal = 18;
    
    event Transfer(address indexed from, address indexed to, uint amount);
    event Approve(address indexed owner, address indexed spender, uint amount);

    function totalSupply() external view returns (uint){
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint){
        return _balance[account];
    }

    function transfer (address recipient, uint amount) external returns (bool){
        if (recipient == address(0)) {
            revert InvalidReceiver();
        }

        if (_balance[msg.sender] < amount) {
            revert InsufficientBalance();
        }

        _balance[msg.sender] -= amount;
        _balance[recipient] += amount;
        emit Transfer (msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint amount) external returns (bool){
       
       if(sender == address(0)){
        revert InvalidSender();
       }
       if(sender == address(0)){
        revert InvalidReceiver();
       }
       if (_balance[sender] < amount) {
            revert InsufficientBalance();
       }

        _balance[sender] -= amount;
        _balance[recipient] += amount;
        _allowance[sender][msg.sender] -= amount;
        emit Transfer (sender, recipient, amount);
        return true;
    }

    function allowance (address sender, address spender) external view returns (uint){
       return _allowance[sender][spender];
    }

    function approve (address spender, uint amount) external returns (bool){
       if (spender == address(0)) {
        revert InvalidSpender();
       }

        _allowance [msg.sender][spender] = amount;
        emit Approve (msg.sender, spender, amount);
        return true;
    }
}

