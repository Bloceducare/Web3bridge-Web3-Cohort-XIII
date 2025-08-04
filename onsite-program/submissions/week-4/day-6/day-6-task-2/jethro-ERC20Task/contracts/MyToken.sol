// SPDX-License-License: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";
import "./TokenLibrary.sol";


contract MyToken is IERC20 {
    using TokenLibrary for uint256;

    TokenLibrary.TokenInfo public tokenInfo;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        require(bytes(name_).length > 0, "Empty name");
        require(bytes(symbol_).length > 0, "Empty symbol");
        tokenInfo = TokenLibrary.TokenInfo(name_, symbol_, 18);
        _totalSupply = initialSupply;
        _balances[msg.sender] = initialSupply;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        require(account != address(0), "Zero address");
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(recipient != address(0), "Zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        require(owner != address(0) && spender != address(0), "Zero address");
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Zero address");
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(sender != address(0) && recipient != address(0), "Zero address");
        require(_balances[sender] >= amount, "Insufficient balance");
        require(_allowances[sender][msg.sender] >= amount, "Insufficient allowance");
        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        _allowances[sender][msg.sender] = _allowances[sender][msg.sender].sub(amount);
        return true;
    }
}