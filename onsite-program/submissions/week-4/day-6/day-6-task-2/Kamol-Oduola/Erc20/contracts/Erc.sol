// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Ierc.sol";


contract ERC20 is Ierc {
    address public owner;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    struct TokenDetails {
        string name;
        string symbol;
        uint8 decimals;
    }

    TokenDetails public token;
    uint256 public totalSupply;

    constructor() {
        owner = msg.sender;
        balances[msg.sender] = 1000000;
        totalSupply = 1000000;

        token = TokenDetails({
            name: "EBA",
            symbol: "Garri",
            decimals: 18
        });
    }

    function name() public view returns (string memory) {
    return token.name;
    }

    function symbol() public view returns (string memory) {
    return token.symbol;
    }

    function decimals() public view returns (uint8) {
    return token.decimals;
    }

    function balanceOf(address _owner) public view override returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public override returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value) public override returns (bool success) {
        require(balances[msg.sender] >= _value, "Insufficient balance");
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external override returns (bool success) {
        require(balances[_from] >= _value, "Not enough balance");
        require(allowed[_from][msg.sender] >= _value, "Not allowed");
        require(_value > 0, "Invalid value");

        balances[_from] -= _value;
        balances[_to] += _value;
        allowed[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function allowance(address _owner, address _spender) external view override returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}
