//SPDX -License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function Transfer ( address recipient, uint amount) external returns (bool);
     function transferFrom (address sender, address recipient, uint amount) external returns (bool);
    function approve ( address spender, uint amount) external returns (bool);
    // function allowance (address sender, address spender) external returns (uint)
}

contract ERC20 is IERC20 {
    uint public totalSupply;
    mapping (address=>uint) public balanceOf;
    mapping(address=> mapping(address=>uint)) public allowance;
    string public name ="cakeToken";
    string public symbol = "CAKE";
    uint public decimal = 18;

    function Transfer (address recipient, uint amount) external returns (bool){
        balanceOf[msg.sender] -= amount;
        balanceOf[receipient] += amount;
        emit Transfer (msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint amount) external returns (bools){
        balanceOf[sender] -= amount;
        balanceOf [recipient] += amount;
        allowance [sender][msg.sender] -=amount;
        emit Transfer (sender, recipient, amount);
        return true;
    }

    function approve (address spender, uint amount) external returns (bool){
        allowance [msg.sender][spender] = amount;
        emit Approve (msg.sender, recipient, amount);
        return true;
    }
}