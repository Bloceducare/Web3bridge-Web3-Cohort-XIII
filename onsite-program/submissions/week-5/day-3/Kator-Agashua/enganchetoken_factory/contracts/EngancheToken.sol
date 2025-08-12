// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {IEngancheToken} from "../interfaces/IEngancheToken.sol";

contract EngancheToken is IEngancheToken {
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = totalSupply_;

        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function allowance(
        address owner,
        address spender
    ) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient tokens!");
        require(
            recipient != address(this),
            "Cannot transfer to token contract itself"
        );

        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        require(
            _allowances[sender][msg.sender] >= amount,
            "Not allowed to spend this much!"
        );
        require(
            _balances[sender] >= amount,
            "Sender doesn't have enough tokens!"
        );
        require(
            recipient != address(this),
            "Cannot transfer to token contract itself"
        );

        _allowances[sender][msg.sender] -= amount;
        _balances[sender] -= amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }
}
