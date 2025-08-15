// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";

contract MockERC20 is Context, IERC20 {
    string public name = "MockToken";
    string public symbol = "MOCK";
    uint8 public decimals = 18;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Expose totalSupply via override
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    // Expose balanceOf via override
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    // Expose allowance via override
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function mint(address to, uint256 amount) external {
        require(to != address(0), "Mint to zero address");

        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        address owner = _msgSender();
        require(to != address(0), "Transfer to zero address");
        require(_balances[owner] >= amount, "Insufficient balance");

        _balances[owner] -= amount;
        _balances[to] += amount;
        emit Transfer(owner, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        address owner = _msgSender();
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        address spender = _msgSender();
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][spender] >= amount, "Insufficient allowance");

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][spender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }

    //Burn function for testing
    function burn(address from, uint256 amount) external {
        require(_balances[from] >= amount, "Burn: insufficient balance");
        _balances[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}