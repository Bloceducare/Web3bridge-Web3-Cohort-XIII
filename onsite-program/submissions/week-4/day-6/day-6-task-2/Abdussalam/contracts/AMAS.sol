// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../Interfaces/IAMAS.sol";

 contract AMAS is IAMAS {
    
    string public symbol;
    string public name;
    uint8 public decimals;
    uint public _totalsupply;
    mapping (address => uint )balances;
    mapping ( address => mapping(address => uint)) allowed;


    // ERC20 Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor () {
        symbol = "AMS";
        name ="Amas Coin";
        decimals = 18;
        _totalsupply = 1_000_000_000_000_000_000_000;
        balances[msg.sender] = _totalsupply;
        emit Transfer(address(0), msg.sender, _totalsupply);
    }

    function totalsupply() external view returns (uint) {
        return _totalsupply - balances[address(0)];
    }

    function balanceOf(address _owner) external view returns (uint balance) {
        return balances[_owner];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowed[owner][spender];
    }

    function transfer(address _to, uint256 _value) external returns (bool success) {
        require(_value <= balances[msg.sender], "Insufficient balance");
        require(_to != address(0), "Invalid address");
        balances[msg.sender] = balances[msg.sender] - _value;
        balances[_to] = balances[_to] + _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    function approve(address _spender, uint256 _value) external returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success) {
        require(_value <= balances[_from], "Insufficient balance");
        require(_value <= allowed[_from][msg.sender], "Allowance exceeded");
        require(_to != address(0), "Invalid address");
        balances[_from] = balances[_from] - _value;
        allowed[_from][msg.sender] = allowed[_from][msg.sender] - _value;
        balances[_to] = balances[_to] + _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

}
    
    

// the contract Address for verifying is 0x9C829A4a0d7e4a9d1A91B4EE0E2bF071e51eEbd8g






